---
title: "RAG Core Concepts Deep Dive"
slug: "rag-concepts-deep-dive"
lang: "en"
source: "rag-concepts-deep-dive.md"
---

# RAG Core Concepts Deep Dive

## What is RAG

RAG (Retrieval-Augmented Generation) is an architectural pattern that combines external knowledge retrieval with large language model generation. The core idea: retrieve relevant documents from a knowledge base first, then feed the results as context to an LLM to generate a response.

The basic formula: `Question → Retrieval → Context + Question → LLM → Answer`

## Why RAG

### RAG vs Fine-tuning

| Dimension | RAG | Fine-tuning |
|-----------|-----|-------------|
| Knowledge updates | Real-time; just update documents | Requires retraining |
| Cost | Low (no training needed) | High (GPU + data labeling) |
| Explainability | High (traceable sources) | Low (knowledge is internalized) |
| Best for | Knowledge-intensive Q&A | Style/format adjustment |
| Hallucination control | Good (supported by citations) | Moderate |
| Data requirements | Minimal | Typically needs large datasets |

The core decision: if you need **up-to-date knowledge** or **traceable answers**, go with RAG. If you need to adjust the model's **output style** or **professional formatting**, go with Fine-tuning. The two can also be combined.

## The Full RAG Pipeline

```
Data Processing:
  Document Collection → Cleaning → Chunking → Embedding → Store in Vector Database

Query Phase:
  User Question → Embed Question → Retrieval → [Reranking] → Prompt Assembly → LLM Generation → Return Answer
```

### 1. Chunking

Splitting long documents into small, retrievable segments is a critical factor in RAG quality.

**Fixed-size Chunking**:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # 500 characters per chunk
    chunk_overlap=100,   # 100 characters overlap between adjacent chunks
    separators=["\n\n", "\n", "。", "，", " "]  # Preferred split points
)
chunks = splitter.split_documents(documents)
```

Pros: simple to implement, fast. Cons: may cut through semantic boundaries.

**Semantic Chunking**:

```python
# Determines semantic boundaries based on embedding similarity
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

splitter = SemanticChunker(
    OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=85  # Split when similarity drops below the 85th percentile
)
chunks = splitter.split_documents(documents)
```

Pros: preserves semantic integrity. Cons: requires embedding calls, slower.

**Parent-Child Chunking**:

```python
# Large chunks for retrieval (high recall), small chunks for LLM input (high precision)
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=500)

parent_chunks = parent_splitter.split_documents(documents)
child_chunks = child_splitter.split_documents(documents)

# At retrieval time: match on children, return parent as context
```

### 2. Embedding

Converting text into high-dimensional vectors so that semantically similar text appears close together in vector space:

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Single text embedding
vector = embeddings.embed_query("What is RAG?")

# Batch embedding
vectors = embeddings.embed_documents(["Document 1", "Document 2", "Document 3"])
```

### 3. Retrieval Methods

**Vector Search**:

```python
# Semantic search based on cosine similarity
results = vectorstore.similarity_search("advantages of RAG", k=5)

# Search with scores
results = vectorstore.similarity_search_with_score("advantages of RAG", k=5)
```

**BM25 Search (Keyword-based)**:

```python
from langchain.retrievers import BM25Retriever

bm25_retriever = BM25Retriever.from_documents(documents, k=5)
results = bm25_retriever.invoke("RAG advantages")
```

BM25 is based on TF-IDF term frequency statistics. It excels at precise keyword matching -- it doesn't understand semantics, but it's fast.

**Hybrid Search + RRF Fusion**:

```python
from langchain.retrievers import EnsembleRetriever

ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.3, 0.7]  # BM25 weight 0.3, vector weight 0.7
)
results = ensemble_retriever.invoke("What are the advantages of RAG")
```

RRF (Reciprocal Rank Fusion) formula: `score(d) = Sum 1/(k + rank_i(d))`, where k is typically 60. RRF merges ranking results from different retrieval methods without needing score normalization.

### 4. Reranking

Reordering candidate documents after initial retrieval to improve relevance:

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

# Using Cohere Rerank
reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=5)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=ensemble_retriever
)
results = compression_retriever.invoke("advantages of RAG")
```

### 5. Generation

Assembling retrieved results into a prompt, then feeding to the LLM for response generation:

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_template("""
Answer the user's question based on the following reference materials.

Requirements:
1. Only answer based on the provided reference materials
2. If the materials don't contain relevant information, clearly state that you don't know
3. Cite sources when referencing information

Reference materials:
{context}

User question: {question}
""")
```

## Evaluation Metrics

### Retrieval Quality

**Recall@k**: The proportion of relevant documents found in the top k results.

```
Recall@5 = Number of relevant documents hit / Total number of relevant documents
```

**MRR (Mean Reciprocal Rank)**: The average of the reciprocal ranks of the first relevant result.

```
MRR = (1/Q) * Sum(1/rank_i)
```

If the first relevant result ranks 1st, RR=1.0; if 3rd, RR=0.333.

**NDCG (Normalized Discounted Cumulative Gain)**: A normalized score that accounts for the position of relevant documents in the ranking.

```
DCG@k = Sum(2^rel_i - 1) / log2(i + 1)
NDCG@k = DCG@k / IDCG@k
```

NDCG is higher when relevant documents appear earlier in the ranking.

### Generation Quality

**Faithfulness**: Whether the generated response is faithful to the retrieved context.

```python
# Evaluating with the RAGAS framework
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

eval_results = evaluate(
    dataset=eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision]
)
print(eval_results)
```

**Answer Relevancy**: Whether the answer is on-topic.

**Context Precision**: How much of the retrieved context is actually relevant.

**Context Recall**: Whether all information needed for the answer was retrieved.

## Common Optimization Strategies

1. **Query Rewriting**: Rephrase user questions to improve retrieval hit rates
2. **HyDE**: Have the LLM generate a hypothetical answer first, then use that answer for retrieval
3. **Multi-stage Retrieval**: Coarse filtering (vector search) → Fine ranking (Reranker)
4. **Metadata Filtering**: Use document metadata (date, category) to pre-filter the candidate set
5. **Adaptive Retrieval**: Dynamically decide whether retrieval is needed based on question complexity
