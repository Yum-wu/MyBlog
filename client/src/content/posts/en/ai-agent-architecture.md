---
title: "AI Agent Architecture Design"
slug: "ai-agent-architecture"
lang: "en"
source: "ai-agent-architecture.md"
---

# AI Agent Architecture Design

## What is an AI Agent

An AI Agent is an intelligent system capable of autonomously perceiving its environment, formulating plans, invoking tools, and executing tasks. Unlike simple LLM calls, agents have **autonomous decision-making capabilities** -- they can dynamically adjust their action strategies based on intermediate results rather than following a fixed execution flow.

Core components: LLM (brain) + Tools + Memory + Planning

## The ReAct Pattern

ReAct (Reasoning + Acting) is the most classic agent pattern, alternating between reasoning and action:

```
Thought: The user wants to know today's weather in Beijing. I need to call the weather API.
Action: search_weather(city="Beijing")
Observation: Beijing is sunny today, 28°C
Thought: I've got the weather info, now I can answer the user.
Answer: Today in Beijing it's sunny with a temperature of 28°C -- great for going outside.
```

The core ReAct loop: `Thought -> Action -> Observation -> Thought -> ... -> Answer`

### LangChain Implementation

```python
from langchain.agents import create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

react_prompt = PromptTemplate.from_template("""
Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}
""")

agent = create_react_agent(
    llm=ChatOpenAI(model="gpt-4o"),
    tools=tools,
    prompt=react_prompt
)
```

## Tool Calling

Tool Calling is the mechanism through which agents interact with the outside world, enabling LLMs to call functions, APIs, databases, and more:

### Tool Definition

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Approach 1: Simple tool
@tool
def get_weather(city: str) -> str:
    """Get weather information for a given city"""
    return f"{city} is sunny today, 25°C"

# Approach 2: With structured input
class SearchInput(BaseModel):
    query: str = Field(description="Search keywords")
    max_results: int = Field(default=5, description="Maximum number of results")

@tool(args_schema=SearchInput)
def web_search(query: str, max_results: int = 5) -> str:
    """Search the web for information"""
    results = perform_search(query, max_results)
    return str(results)

# Approach 3: Database query tool
@tool
def query_database(sql: str) -> str:
    """Execute SQL query (read-only)"""
    # Safety check: block INSERT/UPDATE/DELETE
    if any(keyword in sql.upper() for keyword in ["INSERT", "UPDATE", "DELETE", "DROP"]):
        return "Error: Write operations are not allowed"
    result = db.execute(sql)
    return str(result)
```

### Tool Security Principles

1. **Least privilege**: Tools should only expose the capabilities they need
2. **Input validation**: Use Pydantic for structured validation
3. **Sandboxed execution**: Avoid dangerous operations like `eval` and `exec`
4. **Rate limiting**: Set frequency limits on API-calling tools
5. **Read-only by default**: Database tools should default to read-only; write operations require explicit confirmation

## Memory System

### Short-term Memory

Manages the context window for the current conversation:

```python
from langgraph.checkpoint.memory import MemorySaver

# Conversation buffer
from langchain.memory import ConversationBufferMemory
memory = ConversationBufferMemory(return_messages=True)

# Sliding window (keep only the last N rounds)
from langchain.memory import ConversationBufferWindowMemory
memory = ConversationBufferWindowMemory(k=10)

# Summary compression (great for long conversations)
from langchain.memory import ConversationSummaryBufferMemory
memory = ConversationSummaryBufferMemory(
    llm=llm,
    max_token_limit=2000  # Auto-compress after 2000 tokens
)
```

### Long-term Memory

Memory that persists across sessions:

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# Persist to SQLite
checkpointer = SqliteSaver.from_conn_string("memory.db")

# LangGraph agents support this natively
from langgraph.graph import StateGraph, MessagesState

graph = StateGraph(MessagesState)
# ... add nodes and edges ...

app = graph.compile(checkpointer=checkpointer)

# Pass a thread_id when using
config = {"configurable": {"thread_id": "user-123"}}
result = app.invoke({"messages": [("user", "I want to learn Python")]}, config)
```

### Memory Storage Options Compared

| Option | Persistent | Capacity | Query Capability | Use Case |
|------|-------|------|---------|---------|
| BufferMemory | No | Small | None | Simple conversations |
| SummaryMemory | No | Medium | None | Long conversations |
| SQLite Checkpointer | Yes | Medium | Basic | Single-user apps |
| Redis | Yes | Large | Basic | High concurrency |
| Vector Database | Yes | Large | Semantic search | Knowledge-retrieval memory |

## Multi-Agent Systems

### Architecture Patterns

**1. Orchestrator-Worker Pattern**:

```python
from langgraph.graph import StateGraph, MessagesState, START, END

# The orchestrator assigns tasks; workers execute them
orchestrator_prompt = """You are a project coordinator. Based on user requirements,
assign tasks to the appropriate experts.

Available experts:
- researcher: responsible for information gathering and research
- coder: responsible for code implementation
- reviewer: responsible for code review
"""
```

**2. Debate/Consensus Pattern**:

Multiple agents offer different perspectives on the same issue, reaching consensus through discussion.

**3. Pipeline Pattern**:

```python
# Each agent handles a specific stage
pipeline = (
    researcher_agent |  # Research
    coder_agent |       # Implementation
    reviewer_agent      # Review
)
```

### LangGraph Multi-Agent Orchestration

```python
from langgraph.graph import StateGraph, MessagesState
from typing import Literal

def researcher(state: MessagesState):
    """Research agent"""
    # Execute research tasks
    return {"messages": [("assistant", "Research findings...")]}

def coder(state: MessagesState):
    """Coding agent"""
    return {"messages": [("assistant", "Code implementation...")]}

def reviewer(state: MessagesState):
    """Review agent"""
    return {"messages": [("assistant", "Review comments...")]}

def router(state: MessagesState) -> Literal["researcher", "coder", "reviewer", END]:
    last_msg = state["messages"][-1].content
    if "needs research" in last_msg:
        return "researcher"
    elif "needs coding" in last_msg:
        return "coder"
    elif "needs review" in last_msg:
        return "reviewer"
    return END

# Build the graph
graph = StateGraph(MessagesState)
graph.add_node("researcher", researcher)
graph.add_node("coder", coder)
graph.add_node("reviewer", reviewer)
graph.add_edge(START, "researcher")
graph.add_conditional_edges("researcher", router)

app = graph.compile()
```

## Agent vs Chain vs Function Calling

| Dimension | Chain | Function Calling | Agent |
|------|-------|-----------------|-------|
| Execution flow | Fixed linear | LLM decides which function to call | Dynamic multi-step |
| Autonomy | None | Limited (single turn) | High (multi-turn loop) |
| Use case | Simple pipelines | Single tool call | Complex multi-step tasks |
| Token consumption | Low | Medium | High |
| Predictability | High | Medium | Low |
| Implementation complexity | Low | Low | Medium-High |

**Selection guide**:
- Fixed steps, no branching needed -> **Chain**
- Need to call 1-2 tools -> **Function Calling**
- Need dynamic decision-making and multi-step reasoning -> **Agent**
- Need state persistence and loops -> **LangGraph Agent**

## Production Considerations

1. **Observability**: Log each agent's Thought/Action/Observation for debugging
2. **Timeout control**: Set maximum loop count and total time limit to prevent infinite loops
3. **Error recovery**: Fallback strategies when tool calls fail (retry, skip, switch tools)
4. **Cost control**: Monitor token consumption and set per-request limits
5. **Parallel execution**: Tools with no dependencies can be called in parallel to reduce latency
6. **Human-in-the-loop**: Add confirmation steps at critical decision points
