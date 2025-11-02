import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { workspace, window } from 'vscode';

interface TestCase {
  input: string;
  output: string;
}

interface ProblemData {
  name: string;
  tests: TestCase[];
}

export class CompanionListener {
  private server: http.Server;

  constructor() {
    this.server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => this.handleProblemData(body, res));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.server.listen(27121, () => {
      console.log('Listening for Competitive Companion on port 27121');
    });
  }

  private handleProblemData(body: string, res: http.ServerResponse) {
    try {
      const data: ProblemData = JSON.parse(body);
      this.saveTestCases(data);
      window.showInformationMessage(`Received ${data.name} with ${data.tests.length} test cases`);
      res.writeHead(200);
      res.end('OK');
    } catch (e) {
      console.error('Failed to parse data:', e);
      res.writeHead(500);
      res.end('Error');
    }
  }

  private saveTestCases(data: ProblemData) {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      window.showErrorMessage('No workspace open');
      return;
    }

    const testDir = path.join(workspaceFolder.uri.fsPath, 'testcases');
    fs.mkdirSync(testDir, { recursive: true });

    // 保存样例
    data.tests.forEach((test, index) => {
      fs.writeFileSync(path.join(testDir, `test_${index}.in`), test.input);
      fs.writeFileSync(path.join(testDir, `test_${index}.out`), test.output.trim());
    });
  }

  dispose() {
    this.server.close();
  }
}