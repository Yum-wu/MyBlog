---
paths:
  - "README*"
---

# README 双语规范

参考 system-design-primer (260k⭐)、996.ICU (270k⭐) 等高星项目。

## 格式

分离文件 + 顶部一行链接切换：

```html
<p align="center">
  <b>English</b> · <a href="./README.zh.md">中文</a>
</p>
```

## 命名

| 语言 | 文件名 |
|------|--------|
| English（默认） | `README.md` |
| 简体中文 | `README.zh.md` |

## 不推荐

- ❌ `<details>` 折叠切换 — 不直观
- ❌ 单文件双语并列 — 维护困难
- ❌ URL 跳转外部翻译 — 应仓库内切换
