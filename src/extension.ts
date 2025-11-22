import * as vscode from "vscode";
import { CompanionListener } from "./companionListener";
import { CodeEvaluator } from "./evaluator";

export function activate(context: vscode.ExtensionContext) {
  // 启动 Competitive Companion 监听器
  const listener = new CompanionListener();
  context.subscriptions.push(listener); // 注册评测命令

  const evaluator = new CodeEvaluator();
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "luogu-tester.evaluate",
      (editor) => {
        // 仅当文件扩展名为 .cpp 时执行评测
        if (editor.document && editor.document.languageId === "cpp") {
          evaluator.evaluate(editor.document);
        } else {
          vscode.window.showWarningMessage(
            "Luogu Tester only supports C++ files (.cpp) for evaluation."
          );
        }
      }
    )
  );

  vscode.window.showInformationMessage(
    "洛谷评测助手已激活（请使用 Competitive Companion 发送题目）"
  );
}

export function deactivate() {}