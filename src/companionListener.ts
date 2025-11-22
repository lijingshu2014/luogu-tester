import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { workspace, window, Uri, languages } from "vscode"; // 引入 Uri 和 languages

interface TestCase {
  input: string;
  output: string;
}

interface ProblemData {
  name: string;
  tests: TestCase[];
  timeLimit?: number; // 添加 timeLimit 属性，以秒为单位
}

// 导出存储数据的变量，供 evaluator.ts 使用
export let latestProblemData: ProblemData | null = null;

export class CompanionListener {
  private server: http.Server;

  constructor() {
    this.server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => this.handleProblemData(body, res));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.server.listen(27121, () => {
      console.log("Listening for Competitive Companion on port 27121");
    });
  }

  private handleProblemData(body: string, res: http.ServerResponse) {
    try {
      const data: ProblemData = JSON.parse(body);
      latestProblemData = data; // 存储最新数据

      this.saveTestCases(data);
      this.createCodeFile(data); // 自动创建代码文件
      window.showInformationMessage(
        `Received ${data.name} with ${data.tests.length} test cases`
      );
      res.writeHead(200);
      res.end("OK");
    } catch (e) {
      console.error("Failed to parse data:", e);
      res.writeHead(500);
      res.end("Error");
    }
  }

  private getProblemId(name: string): string {
    // 尝试匹配常见的题号格式，例如 P1001, CF1C, U192832 等
    const match = name.match(/^(P|B|CF|SP|AT|UVA|T|U)\d+[a-zA-Z0-9_]*|(\w+)/);
    return match ? match[0] : "UnknownProblem";
  }

  private saveTestCases(data: ProblemData) {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      window.showErrorMessage("No workspace open");
      return;
    }

    const problemId = this.getProblemId(data.name); // 新的测试用例目录结构：testcases/{题号}
    const testDir = path.join(
      workspaceFolder.uri.fsPath,
      "testcases",
      problemId
    );
    fs.mkdirSync(testDir, { recursive: true }); // 保存样例

    data.tests.forEach((test, index) => {
      // 移除 Windows 换行符，确保跨平台一致性
      fs.writeFileSync(
        path.join(testDir, `test_${index}.in`),
        test.input.replace(/\r/g, "")
      );
      fs.writeFileSync(
        path.join(testDir, `test_${index}.out`),
        test.output.replace(/\r/g, "").trim()
      );
    });
  }

  private async createCodeFile(data: ProblemData) {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const problemId = this.getProblemId(data.name);
    const cppFileName = `${problemId}.cpp`;
    const cppFilePath = path.join(workspaceFolder.uri.fsPath, cppFileName); // 如果文件不存在，则创建并填充基本模板

    if (!fs.existsSync(cppFilePath)) {
      const templateContent = `#include <bits/stdc++.h>

using namespace std;

// Problem: ${data.name}
// Time Limit: ${data.timeLimit !== undefined ? data.timeLimit : 1}s

int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);

    return 0;
}`;
      fs.writeFileSync(cppFilePath, templateContent); // 自动打开新创建的文件
      const uri = Uri.file(cppFilePath);
      const document = await workspace.openTextDocument(uri);
      await window.showTextDocument(document);
      window.showInformationMessage(`Created new file: ${cppFileName}`);
    } else {
      // 如果文件存在，也尝试打开它，方便用户切换
      const uri = Uri.file(cppFilePath);
      const document = await workspace.openTextDocument(uri);
      await window.showTextDocument(document);
    }
  }

  dispose() {
    this.server.close();
  }
}
