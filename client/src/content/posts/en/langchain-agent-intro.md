---
title: "Getting Started with LangChain Agents"
date: 2026-05-20
slug: langchain-agent-intro
tags: [AI, LangChain, Agent, Tutorial]
category: Technology
lang: en
excerpt: LangChain Agent is the foundational framework for building AI tool-calling capabilities.
---

# Getting Started with LangChain Agents

LangChain Agent lets an LLM dynamically decide which tools to invoke based on user input.

## Core Concepts

- **LLM**: Understands user intent and decides the next action
- **Tools**: External functions that the agent can call
- **Agent Executor**: Orchestrates the loop between the LLM and tools

### Execution Flow

1. User input -> LLM decides whether to call a tool
2. Outputs a structured tool call request (tool name + parameters)
3. Agent Executor executes the tool and returns the result to the LLM
4. LLM evaluates whether the request is satisfied; if not, it calls another tool
5. Loop continues until the task is complete or the max iteration count is reached

## Registering Tools

```python
from langchain.tools import tool

@tool
def calculator(expression: str) -> str:
    """Calculate the result of a math expression"""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"Calculation error: {e}"
```

## Best Practices

1. Write precise tool descriptions
2. Set a maximum iteration count
3. Handle exceptions gracefully
4. Register tools conditionally
