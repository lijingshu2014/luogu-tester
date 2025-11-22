import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import { workspace, window, TextDocument } from "vscode";
import { latestProblemData } from "./companionListener"; // 导入最新题目数据

type JudgeResult = "AC" | "CE" | "TLE" | "RE" | "WA";

export class CodeEvaluator {
  // 默认超时时间（毫秒），与 README.md 保持一致
  private defaultTimeout = 10000; // 获取题目 ID (与 companionListener 中逻辑保持一致)

  private getProblemId(name: string): string {
    const match = name.match(/^(P|B|CF|SP|AT|UVA|T|U)\d+[a-zA-Z0-9_]*|(\w+)/);
    return match ? match[0] : "UnknownProblem";
  }

  async evaluate(document: TextDocument) {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      window.showErrorMessage("No workspace open");
      return;
    } // 获取当前代码文件对应的题号，作为 testcase 目录名

    const codeFileNameNoExt = path.basename(
      document.uri.fsPath,
      path.extname(document.uri.fsPath)
    );
    const problemId = this.getProblemId(codeFileNameNoExt); // 根据题号构建 testcases 目录路径
    const testDir = path.join(
      workspaceFolder.uri.fsPath,
      "testcases",
      problemId
    );
    if (!fs.existsSync(testDir)) {
      window.showErrorMessage(
        `No test cases found for ${problemId} (use Competitive Companion first)`
      );
      return;
    }

    const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".in"));
    if (testFiles.length === 0) {
      window.showErrorMessage(
        `No test cases found in ${path.basename(testDir)}`
      );
      return;
    } // 从 latestProblemData 中获取时间限制，并转换为毫秒

    const timeLimitMs = latestProblemData?.timeLimit
      ? latestProblemData.timeLimit * 1000
      : this.defaultTimeout;

    const filePath = document.uri.fsPath;
    const codeDir = path.dirname(filePath);
    const codeFileName = path.basename(filePath, path.extname(filePath));
    let exeName: string;
    if (process.platform === "win32") {
      exeName = `${codeFileName}.exe`;
    } else {
      exeName = codeFileName;
    }
    const exePath = path.join(codeDir, exeName);
    try {
      // 编译代码
      child_process.execSync(`g++ ${filePath} -std=c++14 -O2 -o ${exePath}`, {
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8",
      });
      window.showInformationMessage("Compilation Successful ✅");
    } catch (e: any) {
      const compileError = e.stderr || "Unknown compilation error";
      window.showErrorMessage(
        `Compilation Error (CE) ❌\n${compileError.slice(0, 500)}`
      );
      this.cleanupExecutable(exePath);
      return;
    }
    let childProcess: child_process.ChildProcess | null = null;
    for (const inFile of testFiles) {
      const testIndex = inFile.replace(".in", "");
      const outFile = `${testIndex}.out`;
      const input = fs.readFileSync(path.join(testDir, inFile), "utf8");
      const expectedOutput = fs
        .readFileSync(path.join(testDir, outFile), "utf8")
        .trim();

      let result: JudgeResult = "RE";
      let actualOutput = "";
      let errorDetails = "";
      let startTime = 0;
      let executionTime = 0;

      try {
        startTime = Date.now();
        actualOutput = await new Promise((resolve, reject) => {
          childProcess = child_process.spawn(exePath);
          if (!childProcess) {
            reject(new Error("Failed to create child process"));
            return;
          }

          let output = "";
          let error = "";
          if (childProcess.stdin) {
            childProcess.stdin.write(input);
            childProcess.stdin.end();
          } else {
            reject(new Error("Child process stdin is null"));
            return;
          }
          childProcess.stdout?.on(
            "data",
            (chunk) => (output += chunk.toString())
          );
          childProcess.stderr?.on(
            "data",
            (chunk) => (error += chunk.toString())
          ); // 监听进程退出
          childProcess.on("exit", (code, signal) => {
            if (code === 0) {
              resolve(output.trim());
            } else if (code !== null) {
              reject(new Error(`Exit code: ${code}, Error: ${error}`));
            } else if (signal) {
              reject({
                signal: signal,
                message: `Killed by signal: ${signal}`,
              });
            }
          }); // 监听进程错误

          childProcess.on("error", (err) => reject(err)); // 设置超时

          setTimeout(() => {
            const process = childProcess as child_process.ChildProcess | null;
            if (process?.pid) {
              this.killProcess(process.pid);
              reject(new Error("Timeout"));
            } else {
              reject(new Error("Timeout but no child process pid found"));
            }
          }, timeLimitMs);
        });

        executionTime = Date.now() - startTime;
        if (executionTime >= timeLimitMs) {
          result = "TLE";
          errorDetails = `Execution time: ${executionTime / 1000}s (limit: ${
            timeLimitMs / 1000
          }s)`;
        } else {
          // WA/AC 判定逻辑
          const normalizeOutput = (str: string) =>
            str.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();
          const normalizedActual = normalizeOutput(actualOutput);
          const normalizedExpected = normalizeOutput(expectedOutput);
          result = normalizedActual === normalizedExpected ? "AC" : "WA";
        }
      } catch (e: any) {
        if (e.message === "Timeout") {
          result = "TLE";
          errorDetails = `Timeout after ${timeLimitMs / 1000}s`;
        } else if (e.signal) {
          // 运行时错误 (RE) - 信号终止
          result = "RE";
          const signalMap: Record<string, string> = {
            SIGSEGV: "Segmentation Fault (段错误)",
            SIGABRT: "Abort (异常终止)",
            SIGFPE: "Floating Point Exception (浮点错误)",
            SIGILL: "Illegal Instruction (非法指令)",
            SIGBUS: "Bus Error (总线错误)",
          };
          errorDetails = `Killed by signal: ${e.signal} (${
            signalMap[e.signal] || "Unknown signal"
          })`;
        } else {
          // 运行时错误 (RE) - 非零退出码
          result = "RE";
          errorDetails = e.message || "Unknown runtime error";
        }
      } finally {
        // 确保子进程被关闭
        const process = childProcess as child_process.ChildProcess | null;
        if (process && typeof process.pid === "number") {
          this.killProcess(process.pid);
          childProcess = null;
        }
      } // 展示结果

      switch (result) {
        case "AC": // 移除内存使用统计
          window.showInformationMessage(
            `Test ${testIndex}: Accepted (AC) ✅\n` +
              `Execution time: ${executionTime / 1000}s`
          );
          break;
        case "WA":
          window.showErrorMessage(
            `Test ${testIndex}: Wrong Answer (WA) ❌\n` +
              `Expected Output:\n${expectedOutput}\n` +
              `Actual Output:\n${actualOutput}`
          );
          break;
        case "TLE":
          window.showErrorMessage(
            `Test ${testIndex}: Time Limit Exceeded (TLE) ⏱️\n` +
              `${errorDetails}\n` +
              `Note: Time limit is ${timeLimitMs / 1000}s`
          );
          break;
        case "RE":
          window.showErrorMessage(
            `Test ${testIndex}: Runtime Error (RE) 💥\n` +
              `${errorDetails}\n` +
              `Output before crash:\n${actualOutput || "No output"}`
          );
          break;
      }
    }
    this.cleanupExecutable(exePath);
  }
  /**
   * 强制终止进程（跨平台兼容）
   * @param pid 进程ID
   */

  private killProcess(pid: number) {
    try {
      if (process.platform === "win32") {
        child_process.execSync(`taskkill /F /T /PID ${pid}`, {
          stdio: "ignore",
        });
      } else {
        process.kill(pid, "SIGKILL");
      }
    } catch (err) {
      console.log(`Process ${pid} already exited or killed`);
    }
  }
  /**
   * 安全清理可执行文件（处理占用情况）
   * @param exePath 可执行文件路径
   */

  private cleanupExecutable(exePath: string) {
    if (!fs.existsSync(exePath)) return;

    try {
      fs.unlinkSync(exePath);
      console.log(`Cleaned up executable: ${exePath}`);
    } catch (err: any) {
      setTimeout(() => {
        try {
          fs.unlinkSync(exePath);
          console.log(`Retried cleanup successful: ${exePath}`);
        } catch (retryErr) {
          console.error(`Failed to clean up executable: ${retryErr}`);
          window.showWarningMessage(
            `Failed to auto-clean executable file (${path.basename(
              exePath
            )}). ` +
              "It may be occupied, please close any related processes and delete it manually."
          );
        }
      }, 1000);
    }
  }
}