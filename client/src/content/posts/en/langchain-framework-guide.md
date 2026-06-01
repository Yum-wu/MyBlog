---
title: "LangChain Framework Guide"
slug: "langchain-framework-guide"
lang: "en"
source: "langchain-framework-guide.md"
---

# LangChain Framework Guide

## What is LangChain

LangChain is an open-source framework for developing LLM-powered applications. It provides modular components and orchestration tools that let developers quickly build RAG systems, AI agents, chatbots, and more.

Its core value lies in abstracting LLM calls, external data retrieval, tool invocation, and memory management into composable modules -- significantly reducing development complexity.

## Core Concepts

### 1. Models

LangChain supports connecting to multiple LLM providers through a unified interface:

```python
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatZhipuAI

# OpenAI
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Zhipu AI
llm = ChatZhipuAI(model="glm-4", temperature=0)

# Unified invocation
response = llm.invoke("Hello, please introduce LangChain")
```

ChatModel is LangChain's core abstraction. All subsequent components (Prompts, Chains, Agents) are built on the unified `BaseChatModel` interface.

### 2. Prompts

PromptTemplate and ChatPromptTemplate are used to build structured prompts:

```python
from langchain_core.prompts import ChatPromptTemplate

# Simple template
prompt = ChatPromptTemplate.from_template(
    "You are a {role}. Please answer the following question in {language}: {question}"
)

# Template with system message
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a {role}, an expert in {domain}."),
    ("human", "{question}")
])

# Using the template
messages = prompt.invoke({
    "role": "tech expert",
    "domain": "Python",
    "language": "English",
    "question": "What is async/await?"
})
```

### 3. Chains

Chains are LangChain's core orchestration mechanism, connecting multiple components into a processing pipeline:

```python
from langchain_core.output_parsers import StrOutputParser

# LCEL (LangChain Expression Language) chain
chain = prompt | llm | StrOutputParser()

# Execute the chain
result = chain.invoke({
    "role": "Python expert",
    "question": "Explain how decorators work"
})
print(result)
```

LCEL is the recommended chaining syntax in LangChain v0.2+. It uses the pipe operator `|` to connect components and supports streaming, async, and parallel execution.

### 4. Agents

Agents dynamically decide which tools to invoke based on user input:

```python
from langchain.agents import create_tool_calling_agent
from langchain_core.tools import tool

@tool
def search_web(query: str) -> str:
    """Search the web for latest information"""
    # Actual search logic
    return f"Search results: latest information about {query}..."

@tool
def calculator(expression: str) -> str:
    """Calculate a mathematical expression"""
    return str(eval(expression))

# Create Agent
tools = [search_web, calculator]
agent = create_tool_calling_agent(llm, tools, prompt)

# Run with AgentExecutor
from langchain.agents import AgentExecutor
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
result = executor.invoke({"question": "What's the weather like in Beijing today? What's the temperature?"})
```

### 5. Memory

The Memory component manages conversation history for context-aware multi-turn dialogues:

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# Buffer memory (retains full conversation history)
memory = ConversationBufferMemory()

# Sliding window memory (keeps the last N rounds)
from langchain.memory import ConversationBufferWindowMemory
memory = ConversationBufferWindowMemory(k=10)

# Summary memory (compresses history into summaries)
from langchain.memory import ConversationSummaryMemory
memory = ConversationSummaryMemory(llm=llm)

# Build conversation chain
chain = ConversationChain(llm=llm, memory=memory)
response = chain.invoke({"input": "I'd like to learn about machine learning"})
response = chain.invoke({"input": "What specific algorithms did you mention earlier?"})
```

### 6. Retrieval

LangChain's Retrieval module supports building RAG systems:

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# 1. Load and split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200
)

# 2. Create vector store
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=OpenAIEmbeddings(model="text-embedding-3-small")
)

# 3. Build RAG chain
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

rag_prompt = ChatPromptTemplate.from_template("""
Answer the question based on the following context. If the context does not contain relevant information, say you don't know.

Context: {context}
Question: {question}
""")

rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)

answer = rag_chain.invoke("What is RAG?")
```

## LangChain vs LangGraph vs Deep Agents

### LangChain

- **Positioning**: Foundation building framework
- **Strengths**: Modular components, LCEL chain orchestration, rich community ecosystem
- **Use cases**: Simple RAG, single-turn tool calls, standard LLM applications

### LangGraph

- **Positioning**: Stateful agent orchestration framework
- **Strengths**: Directed graph-based state machines, supports loops and conditional branching, built-in persistence and human-in-the-loop
- **Use cases**: Complex agent workflows, multi-step reasoning, processes requiring human review

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode

# Define state graph
graph = StateGraph(MessagesState)
graph.add_node("agent", call_model)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {
    "tools": "tools",
    END: END
})
graph.add_edge("tools", "agent")

app = graph.compile()
```

### Deep Agents

- **Positioning**: Autonomous decision-making agent framework
- **Strengths**: Long-running task execution, self-reflection, dynamic planning
- **Use cases**: Open-ended tasks, scenarios requiring autonomous exploration

### Choosing the Right Framework

| Scenario | Recommended Framework |
|----------|----------------------|
| Simple RAG queries | LangChain |
| Multi-turn tool-calling agents | LangChain + Agent |
| Complex workflows (conditional branching, loops) | LangGraph |
| Long-running tasks with persistent state | LangGraph |
| Fully autonomous complex tasks | Deep Agents |
| Production multi-agent collaboration | LangGraph |

## create_agent API in Detail

LangChain provides convenient APIs for creating agents:

```python
from langchain.agents import create_tool_calling_agent, create_react_agent

# Option 1: Tool Calling Agent (recommended, requires model support for tool calling)
agent = create_tool_calling_agent(
    llm=llm,
    tools=tools,
    prompt=prompt_template
)

# Option 2: ReAct Agent (compatible with all models)
from langchain.agents import create_react_agent
agent = create_react_agent(
    llm=llm,
    tools=tools,
    prompt=prompt_template
)
```

Key differences:
- `create_tool_calling_agent`: Relies on the model's native function calling capability -- better performance, but requires model support
- `create_react_agent`: Uses the ReAct prompt pattern -- compatible with all models, but consumes more tokens

## Best Practices

1. **Prefer LCEL**: Use pipe syntax to compose chains instead of the legacy Chain classes
2. **Streaming output**: Always enable streaming in production for a better user experience
3. **Error handling**: Add exception handling to each Tool to prevent the agent pipeline from breaking
4. **Version selection**: Use LangChain v0.3+ -- older APIs have been progressively deprecated
5. **LangGraph first**: When state management is involved, prefer LangGraph over manual state handling
