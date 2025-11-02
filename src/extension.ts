import * as vscode from 'vscode';  // 关键：VS Code 核心 API 包含 window
import { CompanionListener } from './companionListener';
import { CodeEvaluator } from './evaluator';

export function activate(context: vscode.ExtensionContext) {
  // 启动 Competitive Companion 监听器
  const listener = new CompanionListener();
  context.subscriptions.push(listener);

  // 注册评测命令
  const evaluator = new CodeEvaluator();
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('luogu-tester.evaluate', (editor) => {
      if (editor.document) {
        evaluator.evaluate(editor.document);
      }
    })
  );

  // 这里使用 vscode.window 而非直接 window（VS Code API 封装在 vscode 命名空间下）
  vscode.window.showInformationMessage('洛谷评测助手已激活（请使用 Competitive Companion 发送题目）');
}

export function deactivate() {}