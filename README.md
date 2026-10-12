# GeometricExperiments

React、Vite、TypeScript 与 Three.js 的离线桌面应用框架。Electron 生产环境直接加载打包在应用内的 `dist/index.html`，不依赖在线 CDN 或在线 AI 服务。

## 本地开发

网页开发方式保持不变：

```bash
npm run dev
```

同时启动 Vite 与 Electron 桌面窗口：

```bash
npm run dev:desktop
```

## 构建与打包

执行 TypeScript 检查和 Vite 生产构建：

```bash
npm run build
```

在 Windows x64 环境生成 portable 单文件 EXE：

```bash
npm run dist:win
```

输出文件为 `release/AI几何探索实验室.exe`。Vite 使用相对资源路径，因此通过 Electron 的 `file://` 加载时，脚本、样式、图片、字体和放在 `public` 中的本地资源均从应用包内读取。新增 Three.js 模型、纹理和字体时，请使用源码导入或放入 `public`，不要引用 CDN 或其他远程 URL。

## 在 GitHub Actions 手动打包

1. 打开 GitHub 仓库的 **Actions** 页面。
2. 在左侧选择 **Build Windows portable EXE**。
3. 点击 **Run workflow**，选择 `main`，再次点击 **Run workflow**。
4. 等待任务完成，进入该次运行记录。
5. 在页面底部的 **Artifacts** 下载 `AI-geometric-lab-windows-x64-portable`。
6. 解压 Artifact，得到 `AI几何探索实验室.exe`。

工作流只支持 `workflow_dispatch` 手动触发，不会在 Push 时自动打包，也不会创建 GitHub Release。

## Windows 运行说明

- 目标系统为 Windows 10/11 x64，应用无需安装且可离线运行。
- 当前没有配置代码签名。首次运行时 Windows SmartScreen 可能显示“Windows 已保护你的电脑”；确认文件来自本仓库的 Actions 构建后，可选择“更多信息”再选择“仍要运行”。
- macOS 本地环境无法完整验证 Windows EXE 的启动、显卡/WebGL 兼容性和 SmartScreen 行为；应下载 Actions 生成的 EXE，在实际 Windows 10/11 x64 机器上完成最终验收。
