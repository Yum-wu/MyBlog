---
title: "Railway Deploy Fiasco: Lessons After 14 Failures"
date: 2026-06-01
slug: railway-deploy-failure-rollback-lesson
tags: [Railway, Docker, Deployment, Debugging, DevOps]
category: Technology
lang: en
excerpt: 14 Railway deployments, all FAILED -- from BuildKit cache mounts to CRLF line endings, every "fix" introduced a new problem. The final solution: roll back to the last working version and recover production in 5 minutes.
---

# Railway Deploy Fiasco: Lessons After 14 Failures

## Incident Summary

After adding a cross-article query feature to the Aureon project, CI was all green, the code was fine, but Railway deployment failed **14 consecutive times**. Each time I edited the Dockerfile, each edit introduced a new problem. The final fix was to **change nothing and roll back to the last version that worked**.

From discovery to production recovery, it took nearly 24 hours.

## How It Started

The trigger was minor. To speed up Docker builds, I added one line to the Dockerfile:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

It built fine locally, CI tests passed. But Railway threw an error:

```
flag '--mount=type=cache,target=/root/.cache/pip' is missing an id argument
```

## The Chain Reaction

What followed was one error after another:

### Attempt 1: Add the id parameter

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip,id=pip-cache \
    pip install -r requirements.txt
```

Railway responded: `missing the cacheKey prefix from its id`. Railway's BuildKit version doesn't support this cache mount syntax.

### Attempt 2: Remove the cache mount

Just strip out the cache mount entirely and go back to plain `pip install`.

Result: `Could not open requirements file: requirements.txt`. In the process of editing, I accidentally dropped the `COPY backend/requirements.txt .` step.

### Attempt 3: Restore the COPY

Added `COPY backend/requirements.txt .` back. Build succeeded. But the deployment status showed FAILED.

**From this point on, I entered full-blown panic-debugging mode.**

### Attempts 4-14: Various "Fixes"

Every time I spotted a new suspect, I'd change one line and push:

| Attempt | What Changed | New Error |
|---------|-------------|-----------|
| 4 | healthcheckTimeout 120→300s | Still FAILED |
| 5 | sleepApplication false | Still FAILED |
| 6 | Added CACHE_BUST ARG to force rebuild | Still FAILED |
| 7 | Empty commit to trigger deployment | Still FAILED |
| 8 | Changed nginx.conf to use `$PORT` | Still FAILED |
| 9 | Deleted sites-enabled/default | Still FAILED |
| 10 | Changed ENTRYPOINT to inline CMD | Still FAILED |
| 11 | Used sed to fix CRLF line endings | Still FAILED |
| 12 | Ran container as root | Still FAILED |
| 13 | Removed PyTorch to shrink image | Still FAILED |
| 14 | **Rolled back to last working version** | **SUCCESS** |

## What Was the Actual Problem

After the rollback succeeded, I did a post-mortem. The issue was actually simple:

1. **BuildKit cache mount**: Railway's Docker builder doesn't support `--mount=type=cache` syntax. No amount of id or cacheKey arguments would fix it.
2. **Accidentally deleted COPY when removing cache mount**: Manual Dockerfile editing caused a line to be dropped.
3. **All subsequent "fixes" were unnecessary**: Each fix introduced new incompatibilities (CRLF, nginx port, user permissions) that didn't exist in the original version.

**The real root cause was singular: Railway doesn't support BuildKit cache mounts. Removing it fixed everything.**

But after the first fix failed, instead of rolling back to the original version, I kept modifying an already-broken foundation. Every change added new complexity, moving further and further from the correct answer.

## Key Lessons

### 1. Change Only One Thing in Deploy Configs

When editing deployment files like Dockerfile or railway.json, change one thing at a time and verify. If it fails, **revert that one line** instead of piling on more changes.

### 2. Roll Back After Two Failures

If two deployments fail in a row, stop everything. Run `git checkout <last-successful-version> -- Dockerfile railway.json` to restore service first, then debug at leisure.

### 3. Distinguish Build Problems from Deploy Problems

Use `railway logs --build` to check build logs and `railway logs --deployment` to check runtime logs. If the build succeeds but the deploy fails, the problem is at runtime -- don't keep editing the Dockerfile.

```bash
# Build logs
railway logs --build --latest

# Runtime logs
railway logs --deployment --latest

# View deployment history
railway deployment list
```

### 4. Don't Modify the Battlefield During Battle

When debugging deployment issues, don't modify feature code and deploy config at the same time. In this incident, I was adding the cross-article query feature (7 commits) while fixing the Dockerfile (14 commits) -- mixing them together made debugging extremely inefficient.

### 5. Keep a "Known Good Version"

Tag or note the commit where deployment last succeeded:

```bash
git tag -a deploy-ok-20260531 -m "last working Railway deploy"
```

Next time something goes wrong, just run `git diff deploy-ok-20260531 -- Dockerfile railway.json` to see the differences.

## The Rollback (5 Minutes to Recovery)

The actual recovery was straightforward:

```bash
# Find the commit from the last successful deployment
git log --oneline  # Found 9b819c1

# Roll back only the deploy files, keep the feature code
git checkout 9b819c1 -- Dockerfile railway.json

# Commit and push
git add Dockerfile railway.json
git commit -m "fix: revert Dockerfile to last working version"
git push origin main
```

CI passed → Railway build succeeded → Deployment succeeded → Production restored. Under 5 minutes total.

## Summary

| | Time Spent | Changes |
|---|---|---|
| Attempts 1-13 | ~24 hours | 14 fix commits, increasingly chaotic |
| Attempt 14 (rollback) | 5 minutes | 1 commit, 2 files restored |

**When a deployment goes wrong, the most effective fix is often a rollback.** Restore service first, then systematically debug the root cause. Don't make complex changes under pressure.
