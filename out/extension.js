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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode")); // 关键：VS Code 核心 API 包含 window
const companionListener_1 = require("./companionListener");
const evaluator_1 = require("./evaluator");
function activate(context) {
    // 启动 Competitive Companion 监听器
    const listener = new companionListener_1.CompanionListener();
    context.subscriptions.push(listener);
    // 注册评测命令
    const evaluator = new evaluator_1.CodeEvaluator();
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('luogu-tester.evaluate', (editor) => {
        if (editor.document) {
            evaluator.evaluate(editor.document);
        }
    }));
    // 这里使用 vscode.window 而非直接 window（VS Code API 封装在 vscode 命名空间下）
    vscode.window.showInformationMessage('洛谷评测助手已激活（请使用 Competitive Companion 发送题目）');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map