---
paths:
  - "client/src/**/*.tsx"
  - "client/src/**/*.ts"
---

# React/TypeScript 规范

- 使用 React 19 + TypeScript 6
- 组件用函数式 + hooks，不用 class
- 样式用 Tailwind CSS v4，不用 CSS modules
- 暗色模式用 `dark:` 前缀
- 国际化用 `useTranslation()` hook，不用 react-i18next
- 路由懒加载用 `React.lazy()` + `Suspense`
- 重型依赖（highlight.js）用 `import()` 动态加载
