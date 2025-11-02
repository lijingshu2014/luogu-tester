# luogu-tester for VSCode

这是一个用于接收并评测 Competitive Companion 爬取的洛谷样例的 VSCode 插件，用于提高测样例效率。

## 特性

目前只支持 C++ 一种语言和正确或错误两种评测结果。

目前支持的 C++ 编译选项只有 `-std=c++14 -O2`。

## 使用方法

1. 安装 Competitive Companion 浏览器插件（[Chrome 或 Edge](https://chromewebstore.google.com/detail/competitive-companion/cjnmckjndlpiamhfimnnjmnckgghkjbl)，[Firefox](https://addons.mozilla.org/en-US/firefox/addon/competitive-companion/)，假如说你不是一位魔法师，而且你要用 Chrome 或 Edge，那么你可以离线安装，<https://www.chajianxw.com/developer/21930.html>）。
2. 将 Competitive Companion 的端口设置为 `27121`。
3. 在 vscode 中打开一个文件夹，并创建 .cpp 文件，vscode 会通知 `洛谷评测助手已激活（请使用 Competitive Companion 发送题目）`。
4. 在浏览器中打开洛谷题目页面，在 vscode 中写好代码。
5. 点击浏览器插件中的 Competitive Companion 插件的按钮。
6. 转到 vscode，它会通知 `Received {题目名称} with {样例数量} test cases`。
7. 按下快捷键 `ctrl+b`，即可开始评测。
8. vscode 会通知评测结果。

## 注意事项

1. 由于作者的技术原因，打开文件夹并创建 .cpp 文件后需要重启 vscode 才能正常使用，但是如果文件夹里本来就有 .cpp 文件，则不需要重启。
2. 每打开一道题要按一下 Competitive Companion 插件的按钮，否则还是上一道题目的样例。
3. 将 Competitive Companion 的端口设置为 `27121`。