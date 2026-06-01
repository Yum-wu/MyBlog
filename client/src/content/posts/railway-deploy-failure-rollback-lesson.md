---
title: "Railway 部署翻车实录：14 次失败后的回退教训"
date: 2026-06-01
slug: railway-deploy-failure-rollback-lesson
tags: [Railway, Docker, 部署, 踩坑, DevOps]
category: 技术
lang: zh
excerpt: 14 次 Railway 部署全部 FAILED，从 BuildKit cache mount 到 CRLF 换行符，每一次"修复"都引入新问题。最终方案：回退到上次成功版本，5 分钟恢复生产。
---

# Railway 部署翻车实录：14 次失败后的回退教训

## 事故概要

给 Aureon 项目添加跨文章查询功能后，CI 全绿，代码没问题，但 Railway 部署连续失败 **14 次**。每次我都在改 Dockerfile，每次改完都引入新问题。最终方案是——**什么都不改，回退到上次能用的版本**。

从发现问题到恢复生产，折腾了将近 24 小时。

## 问题的起点

起因很小：为了加速 Docker 构建，我在 Dockerfile 里加了一行：

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

本地构建正常，CI 测试通过。但 Railway 报错：

```
flag '--mount=type=cache,target=/root/.cache/pip' is missing an id argument
```

## 失败的连锁反应

接下来的事情，就是一个错误接一个错误：

### 第 1 次：加 id 参数

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip,id=pip-cache \
    pip install -r requirements.txt
```

Railway 回复：`missing the cacheKey prefix from its id`。Railway 的 BuildKit 版本不支持这种 cache mount 语法。

### 第 2 次：删除 cache mount

干脆去掉 cache mount，回到普通 `pip install`。

结果：`Could not open requirements file: requirements.txt`。修改过程中不小心丢了 `COPY backend/requirements.txt .` 步骤。

### 第 3 次：恢复 COPY

加上 `COPY backend/requirements.txt .`，构建成功了。但部署状态显示 FAILED。

**从这里开始，进入了疯狂排查模式。**

### 第 4-14 次：各种"修复"

每次看到一个新的可疑点，就改一行推上去：

| 次数 | 改了什么 | 新错误 |
|------|---------|--------|
| 4 | healthcheckTimeout 120→300s | 还是 FAILED |
| 5 | sleepApplication false | 还是 FAILED |
| 6 | 加 CACHE_BUST ARG 强制重建 | 还是 FAILED |
| 7 | 空提交触发部署 | 还是 FAILED |
| 8 | 改 nginx.conf 用 `$PORT` | 还是 FAILED |
| 9 | 删除 sites-enabled/default | 还是 FAILED |
| 10 | ENTRYPOINT 改 inline CMD | 还是 FAILED |
| 11 | sed 修复 CRLF 换行符 | 还是 FAILED |
| 12 | 容器改为 root 运行 | 还是 FAILED |
| 13 | 去掉 PyTorch 减小镜像 | 还是 FAILED |
| 14 | **回退到上次成功版本** | **✅ SUCCESS** |

## 根本问题是什么

回退成功后复盘，问题其实很简单：

1. **BuildKit cache mount**：Railway 的 Docker builder 不支持 `--mount=type=cache` 语法，无论怎么加 id、cacheKey 都不行
2. **删除 cache mount 后误删 COPY**：手动编辑 Dockerfile 时遗漏了一行
3. **之后的所有"修复"都是多余的**：每次修复引入了新的不兼容（CRLF、nginx 端口、用户权限），而这些问题在原版本中根本不存在

**真正的根因只有一个：Railway 不支持 BuildKit cache mount。去掉就恢复了。**

但我在第一次修复失败后，没有回退到原版本，而是在一个已经坏掉的基础上继续修改。每次修改都增加了新的复杂度，离正确答案越来越远。

## 关键教训

### 1. 改部署配置只改一行

Dockerfile、railway.json 这些部署文件，一次只改一个地方，验证一次。如果失败了，**回退那一行**，而不是继续加新改动。

### 2. 失败两次就回退

如果连续两次部署失败，停下来，`git checkout <上次成功版本> -- Dockerfile railway.json`，先恢复服务，再慢慢排查。

### 3. 分清 build 问题和 deploy 问题

Railway 的 `railway logs --build` 看构建日志，`railway logs --deployment` 看运行日志。如果 build 成功但 deploy 失败，问题在 runtime，不要继续改 Dockerfile。

```bash
# 构建日志
railway logs --build --latest

# 运行日志
railway logs --deployment --latest

# 查看部署历史
railway deployment list
```

### 4. 不要在战斗中修改战场

调试部署问题时，不要同时修改功能代码和部署配置。这次我一边加 cross-article query 功能（7 个 commit），一边修 Dockerfile（14 个 commit），搅在一起排查效率极低。

### 5. 保留"已知好版本"

部署成功的 commit 记下来，或者用 git tag：

```bash
git tag -a deploy-ok-20260531 -m "last working Railway deploy"
```

下次出问题直接 `git diff deploy-ok-20260531 -- Dockerfile railway.json` 看差异。

## 回退操作（5 分钟恢复服务）

实际的恢复操作非常简单：

```bash
# 找到最后一次成功部署对应的 commit
git log --oneline  # 找到 9b819c1

# 只回退部署文件，保留功能代码
git checkout 9b819c1 -- Dockerfile railway.json

# 提交推送
git add Dockerfile railway.json
git commit -m "fix: revert Dockerfile to last working version"
git push origin main
```

CI 通过 → Railway 构建成功 → 部署成功 → 生产恢复。全程不到 5 分钟。

## 总结

| | 耗时 | 改动 |
|---|---|---|
| 第 1-13 次失败 | ~24 小时 | 14 个修复 commit，越改越乱 |
| 第 14 次回退 | 5 分钟 | 1 个 commit，恢复两个文件 |

**当部署出问题时，最有效的修复往往是回退。** 先恢复服务，再有条理地排查根因。不要在紧急状态下做复杂修改。
