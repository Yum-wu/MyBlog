---
title: "The Complete Guide to Vector Databases"
slug: "vector-database-guide"
lang: "en"
source: "vector-database-guide.md"
---

# The Complete Guide to Vector Databases

## What is a Vector Database

A vector database is purpose-built for storing and retrieving high-dimensional vector data. Unlike traditional relational databases that match on exact field values, vector databases find nearest neighbors by computing **similarity** between vectors (such as cosine similarity or Euclidean distance). They are foundational infrastructure for RAG, recommendation systems, image retrieval, and more.

Core capability: given a query vector, quickly find the Top-K most similar vectors in the database.

## Why Vector Databases

**Limitations of traditional databases**:
- SQL can only do exact matching or range queries -- it can't understand semantics
- Full-text search relies on keywords; searching for "feline" won't find "tiger"

**Advantages of vector databases**:
- Semantic search: understands meaning, not just keywords
- High-dimensional retrieval: supports vectors with hundreds to thousands of dimensions
- Similarity ranking: returns the K most relevant results
- Scalability: handles millions to billions of vectors

## Indexing Algorithm Fundamentals

### Flat (Brute Force)

Computes the distance between the query vector and every stored vector. Exact results, but slow.

```
Time complexity: O(n x d), where n = number of vectors, d = dimensions
Use case: fewer than 100K vectors
```

### IVF (Inverted File Index)

Partitions the vector space into regions (Voronoi cells) using K-Means clustering. At query time, only searches within the nearest clusters.

```
Process: vector → cluster assignment → at query time, only search the Top-N nearest cluster regions
Time complexity: O(n/k x d), where k = number of clusters
Use case: medium scale (100K - 10M), balancing accuracy and speed
```

### HNSW (Hierarchical Navigable Small World)

Builds a multi-layer graph structure where the bottom layer contains all vectors and upper layers serve as sparse "highways." At query time, traversal starts from the top layer and descends level by level to quickly locate the target region.

```
Process: build multi-layer graph → start from top-level entry point → greedy search per layer → precise search at bottom layer
Characteristics: fast queries, high memory usage
Use case: latency-sensitive scenarios (real-time search)
```

### Algorithm Comparison

| Algorithm | Query Speed | Memory Usage | Accuracy | Best Scale |
|-----------|------------|--------------|----------|------------|
| Flat | Slow | Low | 100% | < 100K |
| IVF | Medium | Medium | 95%+ | 100K - 10M |
| HNSW | Fast | High | 98%+ | 100K - 100M |

## Major Vector Database Comparison

### ChromaDB

**Highlights**: Lightweight, embedded, developer-friendly. Great for prototypes and small-to-medium projects.

```python
# Installation
# pip install chromadb

import chromadb

# Option 1: In-memory (for development/testing)
client = chromadb.Client()

# Option 2: Persistent storage
client = chromadb.PersistentClient(path="./chroma_db")

# Create a collection
collection = client.get_or_create_collection(
    name="my_docs",
    metadata={"hnsw:space": "cosine"}  # Use cosine similarity
)

# Add documents
collection.add(
    documents=["LangChain is an LLM application framework", "RAG is Retrieval-Augmented Generation"],
    metadatas=[{"source": "doc1"}, {"source": "doc2"}],
    ids=["id1", "id2"]
)

# Query
results = collection.query(
    query_texts=["What is an LLM framework?"],
    n_results=5,
    include=["documents", "distances", "metadatas"]
)
print(results)
```

ChromaDB uses HNSW indexing by default, suitable for scenarios with under 1 million vectors.

### Pinecone

**Highlights**: Fully managed cloud service, ready out of the box, zero operational overhead.

```python
from pinecone import Pinecone

pc = Pinecone(api_key="your-api-key")
index = pc.Index("my-index")

# Insert vectors
index.upsert(vectors=[
    {"id": "doc1", "values": [0.1, 0.2, ...], "metadata": {"source": "wiki"}}
])

# Query
results = index.query(
    vector=[0.1, 0.2, ...],
    top_k=5,
    include_metadata=True
)
```

Ideal for teams that don't want to manage infrastructure and have the budget for it.

### Qdrant

**Highlights**: Open source, written in Rust, excellent performance, rich filtering capabilities.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

client = QdrantClient(host="localhost", port=6333)

# Create a collection
client.create_collection(
    collection_name="my_docs",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
)

# Insert vectors
client.upsert(
    collection_name="my_docs",
    points=[
        PointStruct(id=1, vector=[0.1]*1536, payload={"source": "doc1"})
    ]
)

# Filtered query
from qdrant_client.models import Filter, FieldCondition, MatchValue

results = client.query_points(
    collection_name="my_docs",
    query=[0.1]*1536,
    limit=5,
    query_filter=Filter(
        must=[FieldCondition(key="source", match=MatchValue(value="doc1"))]
    )
)
```

### Weaviate

**Highlights**: Supports hybrid search (vector + BM25), GraphQL API, and built-in vectorization modules.

### Milvus

**Highlights**: Open-source distributed vector database supporting billions of vectors. A Chinese-origin project.

```python
from pymilvus import MilvusClient

client = MilvusClient(uri="http://localhost:19530")

# Create a collection
client.create_collection(
    collection_name="my_docs",
    dimension=1536,
    metric_type="COSINE"
)

# Insert data
client.insert(
    collection_name="my_docs",
    data=[
        {"id": 1, "vector": [0.1]*1536, "text": "RAG is Retrieval-Augmented Generation"}
    ]
)

# Query
results = client.search(
    collection_name="my_docs",
    data=[[0.1]*1536],
    limit=5
)
```

### pgvector

**Highlights**: A PostgreSQL extension, ideal for teams already running a PG infrastructure.

```sql
-- Enable the extension
CREATE EXTENSION vector;

-- Create table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)
);

-- Create HNSW index
CREATE INDEX ON documents
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Semantic query
SELECT content, 1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

## Selection Guide

| Scenario | Recommendation | Why |
|----------|---------------|-----|
| Prototyping | ChromaDB | Zero config, native Python |
| Small projects (<100K) | ChromaDB / pgvector | Simple and sufficient |
| Medium projects (100K-10M) | Qdrant / Milvus | Excellent performance, self-hostable |
| Large projects (>10M) | Milvus / Pinecone | Distributed support |
| Already using PostgreSQL | pgvector | No additional infrastructure needed |
| Don't want to manage ops | Pinecone | Fully managed |
| Need hybrid search | Weaviate | Built-in BM25 + vector |

## Performance Optimization Tips

1. **Dimension choice**: 768 dimensions (BGE-small) is twice as fast as 1536 (OpenAI); prefer lower dimensions when the accuracy trade-off is acceptable
2. **Index parameters**: HNSW's M and ef_construction parameters control the accuracy/speed trade-off
3. **Batch operations**: Perform inserts and queries in batches to minimize network round trips
4. **Metadata filtering**: Narrow the scope with metadata first, then run vector search
5. **Memory management**: Vector database memory consumption scales with vector count and dimensionality -- plan capacity accordingly
