---
title: "A Practical Guide to Choosing Embedding Models"
slug: "embedding-models-guide"
lang: "en"
source: "embedding-models-guide.md"
---

# A Practical Guide to Choosing Embedding Models

## What is Embedding

Embedding is the process of converting text into fixed-length numerical vectors. Semantically similar text ends up close together in vector space, while dissimilar text ends up far apart. This is the foundational technology behind RAG, semantic search, clustering, classification, and more.

The core principle: a deep neural network (typically a Transformer architecture) encodes text into high-dimensional vectors, where each dimension captures some semantic feature of the text.

## Mainstream Embedding Models

### OpenAI text-embedding Series

```python
from langchain_openai import OpenAIEmbeddings

# text-embedding-3-small: best cost-to-performance ratio
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# text-embedding-3-large: highest accuracy
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Supports dimension trimming via MRL (Matryoshka Representation Learning)
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    dimensions=512  # Trim from 1536 dimensions to 512
)
```

OpenAI embeddings support Matryoshka Representation Learning, which allows you to use shorter vectors while retaining performance close to the full dimension.

### BGE Series (BAAI)

BGE (BAAI General Embedding) was developed by the Beijing Academy of Artificial Intelligence and excels in Chinese-language scenarios:

```python
from langchain_huggingface import HuggingFaceEmbeddings

# bge-small-zh-v1.5: lightweight, 130MB, optimized for Chinese
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-zh-v1.5",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)

# bge-base-zh-v1.5: mid-size, 400MB
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-base-zh-v1.5"
)

# bge-large-zh-v1.5: highest accuracy, 1.3GB
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v.5"
)

# bge-m3: multilingual model, supports 100+ languages
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-m3"
)
```

BGE model highlights: local deployment, no API costs, strong Chinese performance, and support for `instruction` prefixes to improve retrieval accuracy.

### DashScope (Alibaba Cloud Tongyi)

```python
from langchain_community.embeddings import DashScopeEmbeddings

# text-embedding-v2: Alibaba Cloud Tongyi embedding
embeddings = DashScopeEmbeddings(
    model="text-embedding-v2",
    dashscope_api_key="your-api-key"
)
```

Great for users in mainland China -- low latency and affordable pricing.

### Jina Embeddings

```python
# Jina Embeddings v3: multilingual, supports variable output dimensions
embeddings = HuggingFaceEmbeddings(
    model_name="jinaai/jina-embeddings-v3",
    model_kwargs={"trust_remote_code": True}
)
```

## Model Comparison

| Model | Dimensions | Size | Chinese Performance | Deployment | Latency | Price |
|------|------|------|---------|---------|------|------|
| text-embedding-3-small | 1536 | API | Good | Cloud API | ~50ms | Low |
| text-embedding-3-large | 3072 | API | Good | Cloud API | ~80ms | Medium |
| bge-small-zh | 512 | 130MB | Excellent | Local | ~10ms | Free |
| bge-base-zh | 768 | 400MB | Excellent | Local | ~30ms | Free |
| bge-large-zh | 1024 | 1.3GB | Excellent | Local (GPU) | ~50ms | Free |
| bge-m3 | 1024 | 2.3GB | Excellent | Local (GPU) | ~80ms | Free |
| DashScope v2 | 1536 | API | Good | Cloud API | ~30ms | Low |
| Jina v3 | 1024 | API | Good | Cloud/Local | ~50ms | Medium |

## Local Models vs API

### When to Choose API

- Small dataset with low call frequency
- Don't want to manage GPU resources
- Need quick prototyping
- Network latency is acceptable

### When to Choose Local Models

- Large dataset (millions of documents)
- Need to control costs (free to run)
- Latency-sensitive (offline scenarios)
- Strict data privacy requirements (data can't leave your network)
- Mainland China network environment (APIs may be unreliable)

### Local Deployment Example

```python
from sentence_transformers import SentenceTransformer
import numpy as np

# Load model (auto-downloads on first run)
model = SentenceTransformer("BAAI/bge-small-zh-v1.5")

# Encode documents
documents = [
    "RAG is Retrieval-Augmented Generation",
    "LangChain is an LLM application development framework",
    "Vector databases are used to store and retrieve vectors"
]
doc_embeddings = model.encode(documents, normalize_embeddings=True)

# Encode query (add instruction prefix to improve retrieval)
query = "What is Retrieval-Augmented Generation?"
query_embedding = model.encode(
    [f"Represent this sentence for searching relevant articles: {query}"],
    normalize_embeddings=True
)

# Compute similarity
similarities = np.dot(doc_embeddings, query_embedding.T)
print(f"Most similar document: {documents[np.argmax(similarities)]}")
```

## MTEB Leaderboard

MTEB (Massive Text Embedding Benchmark) is the most authoritative evaluation benchmark for embeddings in the industry:

**Key evaluation dimensions**:
- **Classification**: Text classification tasks
- **Clustering**: Clustering tasks
- **PairClassification**: Text pair matching
- **Retrieval**: Retrieval tasks (most relevant for RAG)
- **STS**: Semantic Textual Similarity
- **Summarization**: Summary quality
- **BitextMining**: Bilingual translation

**How to check**: Visit huggingface.co/spaces/mteb/leaderboard for the latest rankings.

**Selection advice**:
- Models with high Retrieval scores are best suited for RAG
- For Chinese scenarios, check C-MTEB (Chinese MTEB) rankings
- Don't just look at the overall score -- focus on dimensions relevant to your use case

## Choosing Embedding Dimensions

Dimension choice affects storage, retrieval speed, and accuracy:

| Dimensions | Storage (per 1M vectors) | Use Case |
|------|------------------|---------|
| 384 | ~1.5GB | Resource-constrained, high throughput |
| 512 | ~2GB | Lightweight applications |
| 768 | ~3GB | Balanced choice |
| 1024 | ~4GB | High accuracy needs |
| 1536 | ~6GB | OpenAI default |
| 3072 | ~12GB | Maximum accuracy |

Higher dimensions mean more expressive power, but also higher storage and compute costs. In practice, 512-1024 dimensions is a good sweet spot.

## Decision Flowchart

```
1. Dataset < 10K docs -> OpenAI text-embedding-3-small (simple and fast)
2. 10K-1M docs, primarily Chinese -> bge-small-zh (free, fast)
3. 1M+ docs, GPU available -> bge-large-zh or bge-m3
4. Multilingual mix -> bge-m3 or Jina v3
5. Production in mainland China, no GPU management -> DashScope text-embedding-v2
6. Already have an OpenAI API key -> text-embedding-3-small
```

## Best Practices

1. **Use a consistent model**: Document encoding and query encoding must use the same model
2. **Normalize**: Always set `normalize_embeddings=True` and use cosine similarity
3. **Batch processing**: Use batch encoding for large document sets to improve throughput
4. **Instruction prefixes**: BGE models benefit from adding an instruction prefix before queries
5. **Watch for model drift**: After updating a model, re-encode all documents to avoid incompatibility between old and new vectors
