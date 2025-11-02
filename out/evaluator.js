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
        // 获取所有样例文件
        const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.in'));
        if (testFiles.length === 0) {
            vscode_1.window.showErrorMessage('No test cases found');
            return;
        }
        // 编译/运行代码（C++）
        const filePath = document.uri.fsPath;
        const exePath = path.join(workspaceFolder.uri.fsPath, 'a.out');
        try {
            // 编译
            child_process.execSync(`g++ ${filePath} -std=c++14 -O2 -o ${exePath}`, { stdio: 'inherit' });
        }
        catch (e) {
            vscode_1.window.showErrorMessage('Compilation failed');
            return;
        }
        // 逐个测试样例
        for (const inFile of testFiles) {
            const testIndex = inFile.replace('.in', '');
            const outFile = `${testIndex}.out`;
            const input = fs.readFileSync(path.join(testDir, inFile), 'utf8');
            const expectedOutput = fs.readFileSync(path.join(testDir, outFile), 'utf8').trim();
            // 运行程序并获取输出
            const result = child_process.execSync(exePath, { input, encoding: 'utf8' }).trim();
            // 对比结果
            if (result === expectedOutput) {
                vscode_1.window.showInformationMessage(`Test ${testIndex}: Passed ✅`);
            }
            else {
                vscode_1.window.showErrorMessage(`Test ${testIndex}: Failed ❌\nExpected: ${expectedOutput}\nGot: ${result}`);
            }
        }
    }
}
exports.CodeEvaluator = CodeEvaluator;
//# sourceMappingURL=evaluator.js.map