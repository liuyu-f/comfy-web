# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 项目开发记录

AI帮助无代码经验的我创建node.js项目

### 技术栈解释

| 技术           | 详情                                                                |
| -------------- | ------------------------------------------------------------------- |
| Node.js        | #地基，搭建网页的一系列工具基础                                     |
| pnpm           | #包管理器，管理 node 的组件包                                       |
| Vite           | #构建工具，专注于开发体验和打包，与 Next.js 不兼容。内置 http-proxy |
| React          | #核心库(引擎)                                                       |
| TypeScript     | #语言(规矩)，加上了类型的 JS。防止你写出 Bug，大项目标配            |
| React Router   | #路由(管理页面跳转)。Next.js 自带路由，Vite 需要手动装这个          |
| zustand        | #状态管理(管理全局数据)，比如存储“当前生成的图片列表”等             |
| TanStack Query | 请求管理(管理 API 请求)。强烈推荐。用来轮询 ComfyUI 的生图进度神器  |
| ESLint         | #代码分析                                                           |
| Shadcn UI      | #基于 Tailwind 和 Framer Motion 的 UI 模板，有规范化的 css          |

> 注意 Vite 只是构建工具，http-proxy 只在本地开发有效，项目部署到云端或其他地方需要 Nginx 或者一个 Node.js 后端（Express/NestJS） 来扮演这个“代理”的角色。核心依然是使用 http-proxy-middleware 包

### 项目创建 （Vite）

#### 用 pnpm 创建项目 (替代 npx)

创建项目
先使用 vite 创建新的 React 项目，并选择 React + TypeScript 模板：

```Bash pnpm
pnpm create vite@latest
```

#### 安装并配置 Vite 的 shadcn/ui （Vite）

安装 Tailwind CSS

```Bash pnpm
pnpm add tailwindcss @tailwindcss/vite
```

将 src/index.css 的内容替换为以下代码：

```css src/index.css
@import "tailwindcss";
```

编辑 tsconfig.json
当前版本的 Vite 会把 TypeScript 配置拆分为三个文件，其中有两个需要修改。 在 tsconfig.json 与 tsconfig.app.json 的 compilerOptions 中添加 baseUrl 与 paths：

```Json tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  /* 便于 IDE 解析路径别名 */
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

编辑 tsconfig.app.json
在 tsconfig.app.json 中加入以下配置，便于 IDE 解析路径别名：

```Json tsconfig.app.json
{
  "compilerOptions": {
    // ...
    /* 便于 IDE 解析路径别名 */
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
    // ...
  }
}
```

更新 vite.config.ts
在 vite.config.ts 中加入以下配置，确保路径解析正常：

```Bash pnpm
pnpm add -D @types/node
```

```Ts vite.config.ts
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: 'localhost', // 监听地址
    port: 5173, // 监听端口
  },

  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

运行 CLI
执行 `shadcn` 的 init 命令完成初始化：

```Bash pnpm
pnpm dlx shadcn@latest init
```

_注意：这里用了 pnpm dlx，它就是 pnpm 版本的 npx（一次性运行工具）。_
你会根据提示回答几个问题来生成 `components.json`。

```Bash
Which color would you like to use as base color? › Neutral
```

**shadcn-ui 使用方式：**
在[示例组件](https://ui.shadcn.com/docs/components)出查找所需组件，并示例使用下方代码安装组件。

安装 路由管理、状态管理、请求管理

```Bash pnpm
pnpm add react-router-dom zustand @tanstack/react-query
```

### 应用了shadcn的`theming`和`dark-mode` （Vite）

shadcn的[theming](https://ui.shadcn.com/docs/theming)和[dark-mode](https://ui.shadcn.com/docs/dark-mode/vite)

### 项目文件解释

项目就有很多文件了，此时一一解释。

```TXT
comfy-web:.
|   .gitignore
|   components.json
|   eslint.config.js
|   index.html
|   package.json
|   pnpm-lock.yaml
|   pnpm-workspace.yaml
|   README.md
|   tsconfig.app.json
|   tsconfig.json
|   tsconfig.node.json
|   vite.config.ts
|
+---public
|       vite.svg
|
\---src
    |   App.tsx
    |   index.css
    |   main.tsx
    |
    +---assets
    |       react.svg
    |
    +---components
    |   \---ui
    |           button.tsx
    |
    \---lib
            utils.ts
```

> 搞清楚自己的“领地”边界。

你现在的目录结构是一个标准的 **Vite + React + TS + Shadcn UI** 项目。不用被这些文件吓到，**90% 的文件你可能一个月都不会去碰它们一次**。

我把它们按照功能分类，告诉你哪些是干嘛的：

#### 1. 核心配置文件（项目的“大脑”）

这些文件定义了项目如何运行和编译。

- **`vite.config.ts`**: **（重要）** 你的构建配置。你之前写的 API 代理就在这里。
- **`package.json`**: **（重要）** 记录了你安装的所有包（React, Shadcn 等）和运行命令（`dev`, `build`）。
- **`pnpm-lock.yaml`**: 自动生成的。记录了每个包的确切版本，**永远不要手动改它**。
- **`tsconfig.json` 系列**:
  - `tsconfig.json`: 总配置文件。
  - `tsconfig.app.json`: 专门给你的网页代码（src 下的代码）用的 TS 配置。
  - `tsconfig.node.json`: 专门给 Vite 配置文件（运行在 Node 环境下）用的 TS 配置。
  - _为什么拆开？_ 因为网页跑在浏览器，Vite 跑在 Node，它们的 TS 规则略有不同。**一般不需要手动操作。**
- **`index.html`**: 网页的入口。你会发现里面只有一行 `<div id="root"></div>`，React 会把代码塞进这里。

---

#### 2. UI 与样式（你的“装修材料”）

这是安装 Shadcn UI 后出现的文件。

- **`components.json`**: Shadcn UI 的配置文件。它记录了你的 UI 组件存放在哪，用的是哪种颜色主题。**初始化后不用管。**
- **`src/components/ui/`**: **（你会经常看这里）**。
  - 当你运行 `npx shadcn@latest add button` 时，它会把 `button.tsx` 的源代码直接下载到这个文件夹。
  - **重点：** Shadcn 的组件不是在 `node_modules` 里的，而是在你的文件夹里，这意味着你**可以随时直接修改 `button.tsx` 的源代码**。
- **`src/lib/utils.ts`**: Shadcn 生成的工具函数。里面那个 `cn()` 函数是用来合并 Tailwind 类名的。**你会经常在写组件时引用它。**

---

#### 3. 源代码区（你的“工作间”）

这是你 95% 的代码编写地。

- **`src/main.tsx`**: 整个 React 应用的起点。它负责把 `App.tsx` 挂载到 HTML 的 `root` 节点上。
- **`src/App.tsx`**: 你的根组件。目前你所有的测试代码都写在这里。
- **`src/index.css`**: 全局样式。Tailwind 的指令就在这里。

---

#### 4. 几个“奇怪”的文件（实事求是地解释）

- **`pnpm-workspace.yaml`**: 里面存在 `onlyBuiltDependencies`(仅已构建的依赖项)，这是 pnpm v9/v10 版本 引入的安全特性。
  - `onlyBuiltDependencies`：允许 pnpm 在安装时自动构建它包含的依赖项。也就是信任被 pnpm approve-builds 构建过的依赖项。
- **`eslint.config.js`**: 你的“监工”。如果你代码写得不规范（比如定义了变量没用），它会在编辑器里给你画波浪线。

---

#### 总结：你需要手动操作哪些？

| 动作                     | 对应的文件/目录                         |
| :----------------------- | :-------------------------------------- |
| **写业务逻辑、画页面**   | `src/` 里的 `.tsx` 文件（如 `App.tsx`） |
| **调整 API 代理、端口**  | `vite.config.ts`                        |
| **查看安装了什么包**     | `package.json`                          |
| **微调按钮、弹窗的样式** | `src/components/ui/` 里的对应文件       |
| **其他所有文件**         | **基本处于“只读”或“遗忘”状态**          |

### 现在的建议

你现在的 `src` 目录下有点乱（有 `App.tsx`、`main.tsx` 都挤在一起）。
通常我们会建立更多的子文件夹，比如：

- `src/api/`: 专门放连接 ComfyUI 的代码。
- `src/pages/`: 专门放不同的页面。
- `src/store/`: 专门放 Zustand 状态管理。

**你准备好把刚才 `App.tsx` 里那坨乱糟糟的连接逻辑，重构成“像个样子”的文件夹结构吗？** 这就是从“小白”向“开发者”迈进的第一步。
