# luogu-tester for VSCode

这是一个用于接收并评测 Competitive Companion 爬取的洛谷样例的 VSCode 插件，用于提高测样例效率。

## 特性

- 支持 C++ 语言（编译选项：`-std=c++14 -O2`）。
- 完整的评测结果分类：
  - ✅ AC (Accepted)：答案正确
  - ❌ CE (Compilation Error)：编译错误（显示详细错误信息）。
  - ⏱️ TLE (Time Limit Exceeded)：时间超限（默认10秒）。
  - 💥 RE (Runtime Error)：运行时错误（显示信号类型或退出码）。
  - ❌ WA (Wrong Answer)：答案错误（对比期望/实际输出）。
- 自动清理编译生成的可执行文件。
- 输出对比忽略行尾空格和空行差异，减少误判。

## 使用方法

1. 安装 Competitive Companion 浏览器插件（[Chrome 或 Edge](https://chromewebstore.google.com/detail/competitive-companion/cjnmckjndlpiamhfimnnjmnckgghkjbl)，[Firefox](https://addons.mozilla.org/en-US/firefox/addon/competitive-companion/)，假如说你不是一位魔法师，而且你要用 Chrome 或 Edge，那么你可以离线安装，<https://www.chajianxw.com/developer/21930.html>）。
2. 将 Competitive Companion 的端口设置为 `27121`。
3. 在 VS Code 中打开一个文件夹，并创建/打开 .cpp 文件，插件会自动激活（提示：洛谷评测助手已激活）。
4. 在浏览器中打开洛谷题目页面，点击 Competitive Companion 插件按钮发送样例。
5. VS Code 会提示 "Received {题目名称} with {样例数量} test cases"。
6. 在 .cpp 文件编辑界面按下快捷键 `Ctrl+B`（Windows/Linux）或 `Cmd+B`（Mac）开始评测。
7. 查看右下角弹出的评测结果通知。

## 注意事项

1. 由于作者的技术原因，打开文件夹并创建 .cpp 文件后需要重启 VS Code 才能正常使用，若文件夹中已有 .cpp 文件则无需重启。
2. 每切换一道题目需重新点击 Competitive Companion 插件按钮，否则将使用上一道题目的样例。
3. 必须将 Competitive Companion 的端口设置为 `27121`（插件固定监听此端口）。
4. 默认超时时间：10秒（当前版本不支持自定义）。