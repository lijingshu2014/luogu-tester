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
exports.CompanionListener = void 0;
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
class CompanionListener {
    server;
    constructor() {
        this.server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/') {
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => this.handleProblemData(body, res));
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        this.server.listen(27121, () => {
            console.log('Listening for Competitive Companion on port 27121');
        });
    }
    handleProblemData(body, res) {
        try {
            const data = JSON.parse(body);
            this.saveTestCases(data);
            vscode_1.window.showInformationMessage(`Received ${data.name} with ${data.tests.length} test cases`);
            res.writeHead(200);
            res.end('OK');
        }
        catch (e) {
            console.error('Failed to parse data:', e);
            res.writeHead(500);
            res.end('Error');
        }
    }
    saveTestCases(data) {
        const workspaceFolder = vscode_1.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode_1.window.showErrorMessage('No workspace open');
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
exports.CompanionListener = CompanionListener;
//# sourceMappingURL=companionListener.js.map