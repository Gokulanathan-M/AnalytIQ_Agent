"""
Dataset Chat Agent
──────────────────
Responsibilities:
  • Accept a natural language question about the dataset.
  • Use Gemini to translate the question into a valid Pandas expression.
  • Safely execute that expression against the loaded DataFrame.
  • Return a clean, human-readable answer (text + optional mini-table).

Uses a ReAct-style loop:
  Thought → Generate code → Execute → Observe → Respond.
"""

import re
import traceback
import pandas as pd
from typing import Dict, Any

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from src.core.state import AnalystState
from src.utils.llm_factory import get_llm


CHAT_SYSTEM_PROMPT = """
You are a data analyst assistant. The user will ask questions about a pandas DataFrame stored in the variable `df`.

Your job:
1. Write a single valid Python expression (NOT a full script) that answers the question.
2. The expression must be evaluable with Python's `eval()` and must return a value (number, string, list, or DataFrame).
3. Wrap your code in exactly one ```python ... ``` block.
4. After the code block, explain in one sentence what the code does.

Rules:
- Do NOT import anything.
- Do NOT assign variables (no `x = ...`).
- Do NOT call `print()`.
- Only use pandas operations on `df`.
- If the question cannot be answered with data, say so clearly with no code block.

Example:
Question: What is the average age?
```python
df['age'].mean().round(2)
```
This computes the mean of the 'age' column.
""".strip()


def _extract_code(response_text: str) -> str | None:
    """Extract Python code from a markdown code block."""
    pattern = r"```python\s*(.*?)\s*```"
    match = re.search(pattern, response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None


def _safe_eval(code: str, df: pd.DataFrame) -> tuple[Any, str | None]:
    """
    Safely evaluate a Pandas expression.
    Returns (result, error_message).
    """
    # Basic safety guards — block dangerous operations
    BLOCKED = ["import ", "open(", "exec(", "eval(", "os.", "sys.", "__", "subprocess"]
    for bad in BLOCKED:
        if bad in code:
            return None, f"Blocked unsafe expression: '{bad}'"

    local_ns = {"df": df, "pd": pd}
    try:
        result = eval(code, {"__builtins__": {}}, local_ns)  # noqa: S307
        return result, None
    except Exception:
        return None, traceback.format_exc(limit=2)


def _format_result(result: Any) -> str:
    """Format the eval result into a human-readable string."""
    if isinstance(result, pd.DataFrame):
        return result.head(10).to_markdown(index=True)
    if isinstance(result, pd.Series):
        return result.head(10).to_string()
    if isinstance(result, (list, dict)):
        return str(result)[:2000]
    return str(result)


def chat_node(state: AnalystState) -> Dict[str, Any]:
    """
    Dataset Chat Node.

    Processes the last HumanMessage in the conversation as a query,
    generates and executes a Pandas expression using Gemini,
    and appends an AIMessage with the result to the state.
    """
    print("\n========== CHAT AGENT ==========")

    df = state.get("dataset")
    messages = state.get("messages", [])

    if df is None:
        msg = "[CHAT] No dataset loaded. Please upload a dataset first."
        print(msg)
        return {
            "messages": [AIMessage(content=msg)],
        }

    # Get the most recent human query
    human_query = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            human_query = m.content
            break

    if not human_query:
        return {"messages": [AIMessage(content="No question received.")]}

    # Build context for the LLM
    df_info = (
        f"DataFrame shape: {df.shape[0]} rows x {df.shape[1]} columns\n"
        f"Columns: {list(df.columns)}\n"
        f"dtypes:\n{df.dtypes.to_string()}\n"
        f"Sample (first 3 rows):\n{df.head(3).to_string()}"
    )

    user_content = (
        f"Dataset info:\n```\n{df_info}\n```\n\n"
        f"Question: {human_query}"
    )

    try:
        llm = get_llm(temperature=0.1)
        response = llm.invoke([
            SystemMessage(content=CHAT_SYSTEM_PROMPT),
            HumanMessage(content=user_content),
        ])
        raw = response.content
    except Exception as exc:
        answer = f"Sorry, I encountered an error while processing your question: {exc}"
        return {"messages": [AIMessage(content=answer)]}

    # Extract and execute code
    code = _extract_code(raw)
    if not code:
        # LLM answered in prose — return it directly
        return {"messages": [AIMessage(content=raw)]}

    result, error = _safe_eval(code, df)

    if error:
        answer = (
            f"I tried to answer your question but encountered an error:\n\n"
            f"```\n{error}\n```\n\n"
            f"Generated code:\n```python\n{code}\n```"
        )
    else:
        formatted = _format_result(result)
        # Extract the prose explanation from the LLM response (text after the code block)
        explanation = raw.split("```")[-1].strip()
        answer = (
            f"**Answer:**\n\n{formatted}\n\n"
            f"_{explanation}_"
        )

    print(f"[CHAT] Query answered. Code: `{code}`")
    return {"messages": [AIMessage(content=answer)]}
