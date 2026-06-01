---
title: "Designing a Multi-Layer Memory System for AI Agents"
date: 2026-05-21
slug: agent-memory-system
tags: [AI, Agent, Memory, SQLite, Architecture]
category: Technology
lang: en
excerpt: Memory systems are the key to enabling continuous learning and personalized interactions in AI Agents.
---

# Designing a Multi-Layer Memory System for AI Agents

## The Four-Layer Memory Architecture

| Layer | Name | Storage | Persistence | Purpose |
| L0 | Conversation | SQLite | Short-term | Raw conversation logs |
| L1 | Atoms | SQLite | Medium-term | Atomic facts |
| L2 | Scenarios | Markdown | Medium-term | Scenario aggregation |
| L3 | Persona | In-memory | Long-term | User profile |

### L0: Conversation History

Records user and AI messages. Supports sliding window cleanup.

### L1: Atomic Facts

Triple-based facts (subject-predicate-object).

### L2: Scenario Aggregation

Aggregates atomic facts into structured documents when a conversation ends.

### L3: User Profile

Language preferences, tech stack preferences, and response style preferences.

## Relationship with RAG

- RAG: External knowledge, static and shared
- Memory: User interaction history, dynamic and personalized
