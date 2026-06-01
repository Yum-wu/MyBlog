---
title: "Building a RAG System: A Complete Guide"
date: 2026-05-21
slug: rag-system-guide
tags: [AI, RAG, ChromaDB, Embedding, Knowledge Base]
category: Technology
lang: en
excerpt: RAG is the core architecture for building domain-specific knowledge Q&A systems.
---

# Building a RAG System: A Complete Guide

## The Full RAG Pipeline

1. Document Loading - Read Markdown documents from local files
2. Text Chunking - Split into short segments suitable for retrieval
3. Vector Embedding - Convert to vectors using an Embedding model
4. Vector Storage - Store in ChromaDB
5. Retrieval - Query Top-K relevant segments
6. Generation - LLM generates answers based on context

## Text Chunking

```python
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
)
```

## Vector Embedding

Uses the Zhipu Embedding-2 model to generate 768-dimensional vectors.

## Retrieval Optimization

The MMR algorithm considers both relevance and diversity simultaneously.

## Answer Generation

Responds based on reference documents, with citation sources noted at the end.
