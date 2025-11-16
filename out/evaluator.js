"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeEvaluator = void 0;
const child_process = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
class CodeEvaluator {
    timeout = 10000;
    async evaluate(document) {
        const workspaceFolder = vscode_1.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode_1.window.showErrorMessage('No workspace open');
            return;
        }
        const testDir = path.join(workspaceFolder.uri.fsPath, 'testcases');
        if (!fs.existsSync(testDir)) {
            vscode_1.window.showErrorMessage('No test cases found (use Competitive Companion first)');
            return;
        }
        const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.in'));
        if (testFiles.length === 0) {
            vscode_1.window.showErrorMessage('No test cases found');
            return;
        }
        const filePath = document.uri.fsPath;
        const codeDir = path.dirname(filePath);
        const codeFileName = path.basename(filePath, path.extname(filePath));
        let exeName;
        if (process.platform === 'win32') {
            exeName = `${codeFileName}.exe`;
        }
        else {
            exeName = codeFileName;
        }
        const exePath = path.join(codeDir, exeName);
        let compileSuccess = false;
        try {
            child_process.execSync(`g++ ${filePath} -std=c++14 -O2 -o ${exePath}`, {
                stdio: ['ignore', 'pipe', 'pipe'],
                encoding: 'utf8'
            });
            vscode_1.window.showInformationMessage('Compilation Successful ✅');
            compileSuccess = true;
        }
        catch (e) {
            const compileError = e.stderr || 'Unknown compilation error';
            vscode_1.window.showErrorMessage(`Compilation Error (CE) ❌\n${compileError.slice(0, 500)}`);
            this.cleanupExecutable(exePath);
            return;
        }
        let childProcess = null;
        for (const inFile of testFiles) {
            const testIndex = inFile.replace('.in', '');
            const outFile = `${testIndex}.out`;
            const input = fs.readFileSync(path.join(testDir, inFile), 'utf8');
            const expectedOutput = fs.readFileSync(path.join(testDir, outFile), 'utf8').trim();
            let result = 'RE';
            let actualOutput = '';
            let errorDetails = '';
            let startTime = Date.now();
            try {
                startTime = Date.now();
                actualOutput = await new Promise((resolve, reject) => {
                    childProcess = child_process.spawn(exePath);
                    if (!childProcess) {
                        reject(new Error('Failed to create child process'));
                        return;
                    }
                    let output = '';
                    let error = '';
                    if (childProcess.stdin) {
                        childProcess.stdin.write(input);
                        childProcess.stdin.end();
                    }
                    else {
                        reject(new Error('Child process stdin is null'));
                        return;
                    }
                    childProcess.stdout?.on('data', (chunk) => output += chunk.toString());
                    childProcess.stderr?.on('data', (chunk) => error += chunk.toString());
                    childProcess.on('exit', (code) => {
                        if (code === 0) {
                            resolve(output.trim());
                        }
                        else {
                            reject(new Error(`Exit code: ${code}, Error: ${error}`));
                        }
                    });
                    childProcess.on('error', (err) => reject(err));
                    setTimeout(() => {
                        const process = childProcess;
                        if (process?.pid) {
                            this.killProcess(process.pid);
                            reject(new Error('Timeout'));
                        }
                        else {
                            reject(new Error('Timeout but no child process pid found'));
                        }
                    }, this.timeout);
                });
                const executionTime = Date.now() - startTime;
                if (executionTime >= this.timeout) {
                    result = 'TLE';
                    errorDetails = `Execution time: ${executionTime / 1000}s (limit: ${this.timeout / 1000}s)`;
                }
                else {
                    const normalizeOutput = (str) => str.replace(/\r\n/g, '\n').replace(/\s+$/gm, '').trim();
                    const normalizedActual = normalizeOutput(actualOutput);
                    const normalizedExpected = normalizeOutput(expectedOutput);
                    result = normalizedActual === normalizedExpected ? 'AC' : 'WA';
                }
            }
            catch (e) {
                if (e.message === 'Timeout') {
                    result = 'TLE';
                    errorDetails = `Timeout after ${this.timeout / 1000}s`;
                }
                else if (e.signal) {
                    result = 'RE';
                    const signalMap = {
                        'SIGSEGV': 'Segmentation Fault (段错误)',
                        'SIGABRT': 'Abort (异常终止)',
                        'SIGFPE': 'Floating Point Exception (浮点错误)',
                        'SIGILL': 'Illegal Instruction (非法指令)',
                        'SIGBUS': 'Bus Error (总线错误)'
                    };
                    errorDetails = `Killed by signal: ${e.signal} (${signalMap[e.signal] || 'Unknown signal'})`;
                }
                else {
                    result = 'RE';
                    errorDetails = e.message || 'Unknown runtime error';
                }
            }
            finally {
                const process = childProcess;
                if (process && typeof process.pid === 'number') {
                    this.killProcess(process.pid);
                    childProcess = null;
                }
            }
            switch (result) {
                case 'AC':
                    vscode_1.window.showInformationMessage(`Test ${testIndex}: Accepted (AC) ✅\n` +
                        `Execution time: ${(Date.now() - startTime) / 1000}s\n` +
                        `Memory used: ~${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
                    break;
                case 'WA':
                    vscode_1.window.showErrorMessage(`Test ${testIndex}: Wrong Answer (WA) ❌\n` +
                        `Expected Output:\n${expectedOutput}\n` +
                        `Actual Output:\n${actualOutput}`);
                    break;
                case 'TLE':
                    vscode_1.window.showErrorMessage(`Test ${testIndex}: Time Limit Exceeded (TLE) ⏱️\n` +
                        `${errorDetails}\n` +
                        `Note: Time limit is ${this.timeout / 1000}s`);
                    break;
                case 'RE':
                    vscode_1.window.showErrorMessage(`Test ${testIndex}: Runtime Error (RE) 💥\n` +
                        `${errorDetails}\n` +
                        `Output before crash:\n${actualOutput || 'No output'}`);
                    break;
            }
        }
        this.cleanupExecutable(exePath);
    }
    /**
     * 强制终止进程（跨平台兼容）
     * @param pid 进程ID
     */
    killProcess(pid) {
        try {
            if (process.platform === 'win32') {
                child_process.execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
            }
            else {
                process.kill(pid, 'SIGKILL');
            }
        }
        catch (err) {
            console.log(`Process ${pid} already exited or killed`);
        }
    }
    /**
     * 安全清理可执行文件（处理占用情况）
     * @param exePath 可执行文件路径
     */
    cleanupExecutable(exePath) {
        if (!fs.existsSync(exePath))
            return;
        try {
            fs.unlinkSync(exePath);
            console.log(`Cleaned up executable: ${exePath}`);
        }
        catch (err) {
            setTimeout(() => {
                try {
                    fs.unlinkSync(exePath);
                    console.log(`Retried cleanup successful: ${exePath}`);
                }
                catch (retryErr) {
                    console.error(`Failed to clean up executable: ${retryErr}`);
                    vscode_1.window.showWarningMessage(`Failed to auto-clean executable file (${path.basename(exePath)}). ` +
                        'It may be occupied, please close any related processes and delete it manually.');
                }
            }, 1000);
        }
    }
}
exports.CodeEvaluator = CodeEvaluator;
//# sourceMappingURL=evaluator.js.map