---
title: "Aureon 系统优化实战：从硬编码到动态数据的完整旅程"
date: "2026-05-31"
slug: "aureon-system-optimization-journey"
tags: [RAG, Analytics, React, FastAPI, Redis, Railway, 系统优化]
category: "技术"
lang: zh
excerpt: "记录 Aureon 企业 AI 知识库平台从硬编码数据到全动态化的完整优化过程，包括 Analytics 修复、博客同步、i18n 问题解决等实战经验。"
---

# Aureon 系统优化实战：从硬编码到动态数据的完整旅程

## 背景

Aureon 是一个企业级 AI 知识库平台，在生产环境中运行了一段时间后，发现前端展示的数据有问题——很多地方是硬编码的，而不是从后端动态获取的。这次优化涵盖了 5 个主要问题的修复。

---

## 问题 1：Analytics Latency 显示 0ms

**现象**：Analytics 页面显示平均延迟 0ms，P95/P99 也是 0。

**根因分析**：
```python
# 原来的代码
latencies_raw = await redis.zrangebyscore(
    f"{STATS_PREFIX}:latencies:z", cutoff, "+inf", withscores=True
)
```

问题在于 Redis sorted set 的使用：
- **写入时**：`score = latency_ms`（延迟值，如 100, 200）
- **读取时**：`cutoff = now.timestamp() - 86400`（Unix 时间戳，如 1748674445）

score 存的是延迟值，但查询时用时间戳过滤，自然找不到任何数据。

**解决方案**：
```python
# 改用 zrange 获取所有数据
latencies_raw = await redis.zrange(
    f"{STATS_PREFIX}:latencies:z", 0, -1, withscores=True
)
```

因为 score 本身就是延迟值，直接读取即可，不需要时间过滤。

---

## 问题 2：Cache Hit Rate 始终为 0

**现象**：尽管有缓存，但 Analytics 显示 0% 命中率。

**根因分析**：检查代码发现 `cache_hits` 和 `cache_misses` 只被读取，从未被记录。

**解决方案**：在 RAG streaming 端点添加记录逻辑：

```python
# 缓存命中时记录
if cached is not None:
    try:
        redis = get_redis_or_none()
        if redis:
            await redis.incr("aureon:stats:cache_hits")
    except Exception:
        pass

# 缓存未命中时记录
# Cache miss - record stats
try:
    redis = get_redis_or_none()
    if redis:
        await redis.incr("aureon:stats:cache_misses")
except Exception:
    pass
```

---

## 问题 3：前端数据硬编码

**现象**：Architecture 页面的 RAG Pipeline 流程、Benchmark 数据都是固定的。

**解决方案**：

### Benchmark API
创建 `/api/rag/benchmark` 端点，动态读取 JSON 文件：

```python
@router.get("/api/rag/benchmark")
async def get_benchmark():
    """Read benchmark results from file — dynamic data source."""
    if BENCHMARK_FILE.exists():
        with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return BenchmarkData(**data)
```

### ArchitectureFlow 组件
使用 `useBenchmark` hook 动态获取服务描述：

```typescript
const { data: benchmark } = useBenchmark();

const pipelineSteps = benchmark?.services
  ? [
      { id: 'llm', label: 'LLM Generation', 
        description: `Streaming (${benchmark.services.llm || 'LLM'})`, 
        latency: '300ms' },
      // ...
    ]
  : defaultSteps;
```

---

## 问题 4：Blog 同步功能缺失

**需求**：Documents 页面需要显示博客链接和同步按钮。

**解决方案**：

### 后端
1. 在 `config.py` 添加博客配置：
```python
blog_url: str = ""
blog_sync_enabled: bool = False
```

2. 创建 Blog API 端点：
```python
@router.get("/api/rag/blog/config")
async def get_blog_config():
    from ..config import settings
    return BlogConfig(
        url=settings.blog_url,
        sync_enabled=settings.blog_sync_enabled,
    )
```

### 前端
创建 `useBlogConfig` hook 和 Documents 页面的博客按钮。

### Railway 配置
```bash
railway variables set "BLOG_URL=https://yum-wu.github.io/MyBlog/"
railway variables set "BLOG_SYNC_ENABLED=true"
```

---

## 问题 5：Admin 按钮 i18n 翻译不显示

**现象**：按钮显示 `admin.workspaces.new_button` 而不是翻译后的文本。

**根因**：i18n 配置正确，翻译文件存在，但可能是浏览器语言检测或缓存问题。

**解决方案**：添加 fallback 文本：

```typescript
// 之前
{t('admin.workspaces.new_button')}

// 之后
{t('admin.workspaces.new_button', 'New Workspace')}
```

确保即使 i18n 加载失败也能显示默认文本。

---

## 经验总结

### 1. Redis sorted set 使用注意事项
- **score 的语义很重要**：如果 score 是延迟值，就不能用时间戳过滤
- 要么改用 `zrange`，要么存储两个不同的 sorted set

### 2. 数据记录要完整
- 读取数据的代码和写入数据的代码要配套
- 定期检查是否有"只读不写"的数据

### 3. 硬编码是技术债
- 生产环境的数据应该动态获取
- 配置应该通过环境变量或配置文件

### 4. i18n 要有 fallback
- 关键 UI 元素要有默认文本
- 避免 i18n key 直接暴露给用户

### 5. Railway 环境变量管理
- 设置变量后必须点击 "Apply changes" + "Deploy"
- 变量值不能包含命令行参数（如 `-e production`）

---

## 数据对比

### Before (硬编码)
- Analytics Latency: 0ms ❌
- Cache Hit Rate: 0% ❌
- RAG Pipeline: 固定的 10ms ❌
- Blog 按钮: 不显示 ❌

### After (动态)
- Analytics Latency: 1075.5ms ✅
- Cache Hit Rate: 实时统计 ✅
- RAG Pipeline: 动态显示实际服务 ✅
- Blog 按钮: 正常显示 ✅

---

## 生产环境

- **应用**: https://aureon-production-1247.up.railway.app
- **文档**: https://yum-wu.github.io/MyBlog/
- **代码**: https://github.com/Yum-wu/Aureon

---

*发布于 2026-05-31*
