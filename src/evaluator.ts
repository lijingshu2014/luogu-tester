import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { workspace, window, TextDocument } from 'vscode';

export class CodeEvaluator {
  async evaluate(document: TextDocument) {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      window.showErrorMessage('No workspace open');
      return;
    }

    const testDir = path.join(workspaceFolder.uri.fsPath, 'testcases');
    if (!fs.existsSync(testDir)) {
      window.showErrorMessage('No test cases found (use Competitive Companion first)');
      return;
    }

    // 获取所有样例文件
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.in'));
    if (testFiles.length === 0) {
      window.showErrorMessage('No test cases found');
      return;
    }

    // 编译/运行代码（C++）
    const filePath = document.uri.fsPath;
    const exePath = path.join(workspaceFolder.uri.fsPath, 'a.out');
    try {
      // 编译
      child_process.execSync(`g++ ${filePath} -std=c++14 -O2 -o ${exePath}`, { stdio: 'inherit' });
    } catch (e) {
      window.showErrorMessage('Compilation failed');
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
        window.showInformationMessage(`Test ${testIndex}: Passed ✅`);
      } else {
        window.showErrorMessage(`Test ${testIndex}: Failed ❌\nExpected: ${expectedOutput}\nGot: ${result}`);
      }
    }
  }
}