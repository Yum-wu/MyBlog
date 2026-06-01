---
title: "Prompt Engineering: A Practical Guide"
slug: "prompt-engineering-guide"
lang: "en"
source: "prompt-engineering-guide.md"
---

# Prompt Engineering: A Practical Guide

## What is Prompt Engineering

Prompt Engineering is the practice of designing and optimizing inputs to LLMs to produce more accurate and useful outputs. A well-crafted prompt is the single most important factor in AI application quality -- the same model can produce drastically different results depending on the prompt.

The core goal: help the LLM understand the task intent and output in the expected format and quality.

## Core Techniques

### 1. Few-shot Learning

Provide a small number of examples in the prompt to guide the LLM in mimicking the desired output format and style:

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sentiment analysis expert. Classify the sentiment of user reviews."),
    ("human", "This product is great, very satisfied"),
    ("assistant", "positive"),
    ("human", "The service was terrible, waited an hour"),
    ("assistant", "negative"),
    ("human", "It's okay, nothing special"),
    ("assistant", "neutral"),
    ("human", "{input}")  # New input
])

# With few-shot examples, the LLM will automatically output in the "positive"/"negative"/"neutral" format
```

**Best practices**:
- Number of examples: 3-5 is sufficient; more wastes tokens
- Example diversity: cover positive, negative, neutral, and edge cases
- Example consistency: keep input/output format uniform

### 2. Chain-of-Thought (CoT)

Guide the LLM to reason step by step, significantly improving answer quality for complex problems:

```python
# Basic CoT: add "Let's think step by step"
prompt = """Think through this math problem step by step:

A store has 45 apples, sells 2/3 of them, then receives a shipment of 12. How many apples are there now?

Show your reasoning."""

# Structured CoT
prompt = """Analyze the problem using the following steps:

Step 1: Understand the problem - identify knowns and the goal
Step 2: Plan the approach - determine the solution method
Step 3: Execute calculations - work through step by step
Step 4: Verify the answer - check if the result is reasonable

Question: {question}"""
```

**Variants**:
- **Zero-shot CoT**: Simply add "Let's think step by step"
- **Few-shot CoT**: Provide examples that include reasoning steps
- **Tree-of-Thought**: Explore multiple reasoning paths and select the best one

### 3. ReAct (Reasoning + Acting)

Alternate between reasoning and tool calls -- the standard prompt pattern for agent scenarios:

```python
react_prompt = """Answer the following questions step by step.

You have access to these tools:
{tools}

Use this format:
Thought: <your reasoning about what to do>
Action: <tool name>
Action Input: <input for the tool>
Observation: <tool result will appear here>
... (repeat as needed)
Thought: I now have the answer
Final Answer: <your final answer>

Question: {input}"""
```

### 4. Self-Consistency

Run multiple independent reasoning traces and select the most frequent answer:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)  # Needs some randomness

def self_consistency(question, n=5):
    """Sample multiple times and take majority vote"""
    answers = []
    for _ in range(n):
        response = llm.invoke(f"Reason step by step and answer: {question}")
        answers.append(extract_answer(response.content))

    # Vote for the most common answer
    from collections import Counter
    most_common = Counter(answers).most_common(1)[0]
    return most_common[0], most_common[1] / n  # Answer, confidence
```

## System Prompt Design

The System Prompt defines the AI's role, capabilities, and behavioral boundaries:

```python
system_prompt = """# Role
You are a professional technical documentation assistant, specializing in AI and machine learning.

# Capabilities
- Explain technical concepts
- Write code examples
- Analyze and debug code

# Behavioral Rules
1. Respond in the user's language
2. Use English for code comments
3. When uncertain, clearly say "I'm not sure"
4. Never fabricate APIs or libraries that don't exist
5. For complex questions, give the conclusion first, then detailed explanation

# Output Format
- Simple questions: answer directly
- Complex questions: step-by-step answer in Markdown format
- Code questions: provide code + explanation + caveats
"""
```

**System Prompt design principles**:
1. **Clear role definition**: Let the LLM know who it is
2. **Explicit boundaries**: Specify what it can and cannot do
3. **Format specifications**: Define output format for easier post-processing
4. **Priority ordering**: Place important rules first

## Prompt Templates

### Dynamic Templates

```python
from langchain_core.prompts import ChatPromptTemplate

# Basic template
template = ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}"),
    ("human", "{user_input}")
])

# Multi-turn conversation template
multi_turn = ChatPromptTemplate.from_messages([
    ("system", "You are {role}"),
    *[
        (msg["role"], msg["content"])
        for msg in chat_history  # Chat history
    ],
    ("human", "{current_input}")
])

# Conditional template
from langchain_core.prompts import MessagesPlaceholder

conditional = ChatPromptTemplate.from_messages([
    ("system", "You are {role}"),
    MessagesPlaceholder("chat_history", optional=True),  # Optional history
    ("human", "{input}")
])
```

### Template Management

```python
# Load template from file
from langchain_core.prompts import load_prompt

# prompt.json
# {
#     "type": "chat",
#     "template": [
#         {"role": "system", "template": "{system}"},
#         {"role": "human", "template": "{input}"}
#     ]
# }
prompt = load_prompt("prompt.json")
```

## Structured Output

Ensure the LLM produces parseable, structured data:

```python
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# Define output schema
class ProductReview(BaseModel):
    sentiment: str = Field(description="Sentiment: positive/negative/neutral")
    confidence: float = Field(description="Confidence score 0-1")
    key_points: list[str] = Field(description="Key points")
    summary: str = Field(description="One-sentence summary")

# Use with_structured_output to enforce structured output
llm = ChatOpenAI(model="gpt-4o")
structured_llm = llm.with_structured_output(ProductReview)

prompt = ChatPromptTemplate.from_template(
    "Analyze the following product review:\n\n{review}"
)

chain = prompt | structured_llm
result = chain.invoke({"review": "This phone has great camera quality, but the battery life is mediocre"})

# result is a ProductReview object
print(result.sentiment)    # "positive"
print(result.key_points)   # ["Great camera quality", "Mediocre battery life"]
```

## Prompt Evaluation

### Manual Evaluation

```python
# Build evaluation dataset
eval_dataset = [
    {"input": "What is RAG?", "expected": "RAG stands for Retrieval-Augmented Generation"},
    {"input": "Differences between Python and Java", "expected": "Python is dynamically typed..."},
]

# Test and score each item
for item in eval_dataset:
    response = chain.invoke({"input": item["input"]})
    print(f"Input: {item['input']}")
    print(f"Output: {response}")
    print(f"Expected: {item['expected']}")
    print("---")
```

### Automated Evaluation (LLM-as-Judge)

```python
judge_prompt = """Evaluate the quality of the following AI response.

Question: {question}
AI Answer: {answer}
Reference Answer: {reference}

Score on the following dimensions (1-5):
1. Accuracy: Is the information correct?
2. Completeness: Are all key points addressed?
3. Clarity: Is the expression clear?
4. Conciseness: Is redundancy avoided?

Provide a total score and individual scores for each dimension."""

# Use an LLM to evaluate another LLM's output
judge_llm = ChatOpenAI(model="gpt-4o")
judge_chain = ChatPromptTemplate.from_template(judge_prompt) | judge_llm
```

## Best Practices

### General Principles

1. **Be explicit**: State what you want, not what you don't want
2. **Provide context**: Give the LLM sufficient background information
3. **Constrain output format**: JSON, Markdown, lists, etc.
4. **Iterate relentlessly**: Prompt engineering is experiment-driven -- test and adjust continuously
5. **Version control**: Track each prompt version and its performance

### RAG-Specific Prompts

```python
rag_system_prompt = """You are a knowledge Q&A assistant.

Rules:
1. Answer only based on the provided reference materials
2. If the reference materials don't contain relevant information, clearly state "Cannot answer based on available materials"
3. Cite sources when referencing information (e.g., [Source: xxx])
4. Do not fabricate information not present in the materials
5. Keep answers concise and accurate

Reference materials:
{context}"""
```

### Common Pitfalls to Avoid

1. **Over-constraining**: Too many rules can confuse the LLM
2. **Vague instructions**: "Write it better" is less effective than "Use a professional but friendly tone"
3. **Overly long prompts**: Performance may degrade beyond 4000 tokens
4. **Injection attacks**: User input may contain malicious prompts
5. **Test edge cases**: Empty input, extremely long input, mixed languages

### Iterative Optimization Workflow

```
1. Baseline: Write the simplest possible prompt, test basic effectiveness
2. Enhance: Add few-shot examples or CoT guidance
3. Constrain: Add format requirements and boundary rules
4. Evaluate: Quantify effectiveness with an evaluation dataset
5. Iterate: Adjust the prompt based on evaluation results
6. Deploy: A/B test to validate real-world performance
```

Prompt Engineering is an ongoing, iterative process. Every time a model is upgraded, existing prompts need to be re-evaluated and optimized, because different models can respond very differently to the same prompt.
