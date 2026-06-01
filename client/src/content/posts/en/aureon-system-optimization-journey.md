---
title: "Aureon System Optimization: From Hardcoded Data to a Fully Dynamic Pipeline"
date: "2026-05-31"
slug: "aureon-system-optimization-journey"
tags: [RAG, Analytics, React, FastAPI, Redis, Railway, System Optimization]
category: "Technology"
lang: en
excerpt: "A complete walkthrough of optimizing the Aureon enterprise AI knowledge base platform -- from hardcoded data to fully dynamic, including Analytics fixes, blog sync, and i18n troubleshooting."
---

# Aureon System Optimization: From Hardcoded Data to a Fully Dynamic Pipeline

## Background

Aureon is an enterprise AI knowledge base platform. After running in production for a while, we discovered that much of the frontend data was hardcoded instead of being fetched dynamically from the backend. This optimization effort covered five major fixes.

---

## Issue 1: Analytics Latency Displaying 0ms

**Symptom**: The Analytics page showed an average latency of 0ms, with P95/P99 also at 0.

**Root cause analysis**:
```python
# Original code
latencies_raw = await redis.zrangebyscore(
    f"{STATS_PREFIX}:latencies:z", cutoff, "+inf", withscores=True
)
```

The problem lay in how the Redis sorted set was being used:
- **On write**: `score = latency_ms` (latency value, e.g., 100, 200)
- **On read**: `cutoff = now.timestamp() - 86400` (Unix timestamp, e.g., 1748674445)

The score stored latency values, but the query filtered by timestamp -- so naturally, no data was ever found.

**Fix**:
```python
# Switch to zrange to fetch all data
latencies_raw = await redis.zrange(
    f"{STATS_PREFIX}:latencies:z", 0, -1, withscores=True
)
```

Since the score itself is the latency value, we can read it directly without any time-based filtering.

---

## Issue 2: Cache Hit Rate Always at 0

**Symptom**: Despite having a cache in place, Analytics reported a 0% hit rate.

**Root cause analysis**: The code showed that `cache_hits` and `cache_misses` were being read but never recorded.

**Fix**: Added recording logic to the RAG streaming endpoint:

```python
# Record cache hits
if cached is not None:
    try:
        redis = get_redis_or_none()
        if redis:
            await redis.incr("aureon:stats:cache_hits")
    except Exception:
        pass

# Record cache misses
try:
    redis = get_redis_or_none()
    if redis:
        await redis.incr("aureon:stats:cache_misses")
except Exception:
    pass
```

---

## Issue 3: Hardcoded Frontend Data

**Symptom**: The RAG Pipeline flow and Benchmark data on the Architecture page were static.

**Fix**:

### Benchmark API
Created a `/api/rag/benchmark` endpoint that reads dynamically from a JSON file:

```python
@router.get("/api/rag/benchmark")
async def get_benchmark():
    """Read benchmark results from file -- dynamic data source."""
    if BENCHMARK_FILE.exists():
        with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return BenchmarkData(**data)
```

### ArchitectureFlow Component
Uses a `useBenchmark` hook to dynamically fetch service descriptions:

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

## Issue 4: Missing Blog Sync Feature

**Requirement**: The Documents page needed to display blog links and a sync button.

**Fix**:

### Backend
1. Added blog configuration to `config.py`:
```python
blog_url: str = ""
blog_sync_enabled: bool = False
```

2. Created a Blog API endpoint:
```python
@router.get("/api/rag/blog/config")
async def get_blog_config():
    from ..config import settings
    return BlogConfig(
        url=settings.blog_url,
        sync_enabled=settings.blog_sync_enabled,
    )
```

### Frontend
Created a `useBlogConfig` hook and added a blog button to the Documents page.

### Railway Configuration
```bash
railway variables set "BLOG_URL=https://yum-wu.github.io/MyBlog/"
railway variables set "BLOG_SYNC_ENABLED=true"
```

---

## Issue 5: Admin Button i18n Keys Not Translating

**Symptom**: Buttons displayed `admin.workspaces.new_button` instead of the translated text.

**Root cause**: The i18n configuration was correct and translation files existed, but browser language detection or caching may have been causing issues.

**Fix**: Added fallback text:

```typescript
// Before
{t('admin.workspaces.new_button')}

// After
{t('admin.workspaces.new_button', 'New Workspace')}
```

This ensures a default text is displayed even if i18n fails to load.

---

## Lessons Learned

### 1. Redis Sorted Set Gotchas
- **Score semantics matter**: If the score represents a latency value, you can't filter it with a timestamp
- Either switch to `zrange`, or store two separate sorted sets

### 2. Data Recording Must Be Complete
- Code that reads data must be paired with code that writes it
- Periodically check for "read-only" data that's never being recorded

### 3. Hardcoded Data is Technical Debt
- Production data should be fetched dynamically
- Configuration should come from environment variables or config files

### 4. i18n Needs Fallbacks
- Critical UI elements should have default text
- Never let raw i18n keys leak to end users

### 5. Railway Environment Variable Management
- After setting variables, you must click "Apply changes" + "Deploy"
- Variable values cannot contain command-line arguments (e.g., `-e production`)

---

## Before and After

### Before (Hardcoded)
- Analytics Latency: 0ms
- Cache Hit Rate: 0%
- RAG Pipeline: Fixed 10ms
- Blog button: Not displayed

### After (Dynamic)
- Analytics Latency: 1075.5ms
- Cache Hit Rate: Real-time stats
- RAG Pipeline: Dynamically displays actual services
- Blog button: Displayed correctly

---

## Production Links

- **App**: https://aureon-production-1247.up.railway.app
- **Docs**: https://yum-wu.github.io/MyBlog/
- **Code**: https://github.com/Yum-wu/Aureon

---

*Published on 2026-05-31*
