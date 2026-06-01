---
title: "LlamaIndex RAG Development Guide"
slug: "llamaindex-rag-guide"
lang: "en"
source: "llamaindex-rag-guide.md"
---

# LlamaIndex RAG Development Guide

## What is LlamaIndex

LlamaIndex (formerly GPT Index) is a data framework designed specifically for LLM applications. Its core capability is connecting diverse data sources with LLMs to enable efficient Retrieval-Augmented Generation (RAG).

Unlike LangChain, which leans toward general-purpose agent orchestration, LlamaIndex focuses on **data indexing and retrieval**, offering finer-grained control in RAG scenarios.

## Core Architecture: The RAG Pipeline

LlamaIndex's RAG pipeline is divided into three core stages:

```
Loading -> Indexing -> Querying
(Data ingestion)  (Index building)  (Query retrieval)
```

### Stage 1: Loading

LlamaIndex provides a unified `Reader` interface for loading various data sources:

```python
from llama_index.core import SimpleDirectoryReader
from llama_index.readers.file import PDFReader, CSVReader

# Load from a directory (auto-detects file types)
documents = SimpleDirectoryReader("./data").load_data()

# Load a single PDF
reader = PDFReader()
documents = reader.load_data(file_path="./report.pdf")

# Load CSV
reader = CSVReader()
documents = reader.load_data(file_path="./data.csv")
```

Each Document object contains `text` (the content) and `metadata` (such as filename, page number).

### Stage 2: Indexing

Indexing splits Documents into Nodes and builds a searchable index structure:

```python
from llama_index.core import VectorStoreIndex, Settings

# Global settings
Settings.chunk_size = 512
Settings.chunk_overlap = 50

# Build vector index
index = VectorStoreIndex.from_documents(documents)

# Or incrementally add new documents
index.insert_nodes(new_nodes)
```

VectorStoreIndex is the most commonly used index type. It converts text to vectors and stores them in memory, enabling semantic search.

### Stage 3: Querying

Retrieve relevant documents through a Retriever, then generate answers with a Response Synthesizer:

```python
# Basic query
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"
)
response = query_engine.query("What is RAG?")
print(response)

# Streaming query
streaming_response = query_engine.query("What are the advantages of RAG?")
for token in streaming_response.response_gen:
    print(token, end="", flush=True)
```

## Deep Dive into VectorStoreIndex

### Index Construction Methods

```python
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

# Option 1: In-memory index (suitable for small datasets)
index = VectorStoreIndex.from_documents(documents)

# Option 2: Persist to ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection("docs")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)

# Load an existing index
index = VectorStoreIndex.from_vector_store(
    vector_store=vector_store
)
```

### Index Type Comparison

| Index Type | Use Case | Characteristics |
|-----------|----------|----------------|
| VectorStoreIndex | General semantic search | Vector similarity retrieval |
| SummaryIndex | Full-text summarization | Concatenates all documents for the LLM |
| TreeIndex | Hierarchical Q&A | Builds a document tree, retrieves layer by layer |
| KeywordTableIndex | Keyword search | Based on keyword matching |
| KnowledgeGraphIndex | Knowledge graphs | Builds entity-relationship graphs |

## Retriever Patterns

Retrievers are responsible for fetching the most relevant documents from the index:

```python
# Default vector retrieval
retriever = index.as_retriever(similarity_top_k=5)

# Keyword + vector hybrid retrieval
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core.retrievers import QueryFusionRetriever

bm25_retriever = BM25Retriever.from_documents(documents, similarity_top_k=5)
vector_retriever = index.as_retriever(similarity_top_k=5)

# Hybrid retrieval with RRF fusion
hybrid_retriever = QueryFusionRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    num_queries=3,
    use_async=True,
    retriever_weights=[0.4, 0.6]  # BM25 : Vector
)

results = hybrid_retriever.retrieve("Differences between LangChain and LlamaIndex")
```

### Retriever Post-Processing

```python
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.core.postprocessor import KeywordNodePostprocessor

# Similarity filtering
retriever = index.as_retriever(
    similarity_top_k=10,
    node_postprocessors=[
        SimilarityPostprocessor(similarity_cutoff=0.7)
    ]
)
```

## Response Synthesizer

The Response Synthesizer combines retrieved documents with the query to generate the final answer:

```python
from llama_index.core import get_response_synthesizer

# compact mode: compresses multiple documents into a single LLM call (default, recommended)
response = get_response_synthesizer(response_mode="compact")

# refine mode: iteratively refines the answer document by document (more precise but slower)
response = get_response_synthesizer(response_mode="refine")

# tree_summarize: recursive summarization, ideal for long documents
response = get_response_synthesizer(response_mode="tree_summarize")

# simple_summarize: simple concatenation then summarization
response = get_response_synthesizer(response_mode="simple_summarize")
```

Response mode selection:
- **compact**: Best cost-to-quality ratio, suitable for most scenarios
- **refine**: Highest quality but heavier token usage, best for critical Q&A
- **tree_summarize**: Ideal when document content is too long and needs layered summarization

## Integrating Common Vector Databases

### ChromaDB

```python
import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("my_docs")
vector_store = ChromaVectorStore(chroma_collection=collection)
```

### Qdrant

```python
from llama_index.vector_stores.qdrant import QdrantVectorStore

vector_store = QdrantVectorStore(
    collection_name="my_docs",
    url="http://localhost:6333",
    api_key="your-api-key"  # Optional
)
```

### Milvus / Zilliz

```python
from llama_index.vector_stores.milvus import MilvusVectorStore

vector_store = MilvusVectorStore(
    collection_name="my_docs",
    uri="http://localhost:19530",
    dim=1536  # Vector dimension
)
```

### pgvector

```python
from llama_index.vector_stores.postgres import PGVectorStore

vector_store = PGVectorStore.from_params(
    database="postgres",
    host="localhost",
    password="your-password",
    port=5432,
    user="postgres",
    table_name="my_docs"
)
```

## LlamaIndex vs LangChain

| Dimension | LlamaIndex | LangChain |
|-----------|-----------|-----------|
| Core focus | Data indexing and RAG | General-purpose LLM app orchestration |
| Indexing capabilities | Rich (vector/tree/graph/keyword) | Basic (primarily vector stores) |
| Agent capabilities | Available but not the focus | Core strength |
| RAG control granularity | Fine-grained (separate Retriever + Synthesizer) | Moderate |
| Ecosystem integration | Focused on data connectors and indexes | Broad tool and API integrations |
| Learning curve | Gentle for RAG scenarios | General but more concepts |

## Best Practices

1. **Start small**: Begin with VectorStoreIndex to validate your approach, then switch to advanced indexes as needed
2. **Tune chunk_size**: Typically 256-1024 tokens, adjust based on document type and query granularity
3. **Hybrid retrieval**: BM25 + vector hybrid mode outperforms single-method retrieval in most scenarios
4. **Persistent indexes**: Use vector databases (Chroma/Qdrant/Milvus) in production instead of in-memory storage
5. **Evaluation-driven**: Use LlamaIndex's built-in evaluation module to validate retrieval and generation quality
6. **Context window**: Be mindful of the model's context window limits to avoid retrieval results exceeding the cap
