"""
Hybrid Memory Service for PeopleSphere HR Assistant:
- Tier A: Short-term buffer of the latest 3-5 messages (preserves immediate dialogue flow).
- Tier B: Long-term running summary of older conversation turns (retains context over extended chats).
- Free-Tier Friendly: Summarization runs lazily as an async background task only when older turns age out (>= 4 unsummarized messages).
- Zero Latency on Request Path: Reading existing summary from SQLite costs 0 LLM calls and 0ms network latency.
"""

import logging
from typing import List, Dict, Any, Optional

from app.database.db import (
    get_conversation_summary,
    save_conversation_summary,
    get_unsummarized_chat_messages,
    get_employee_chat_history
)
from app.services.gemini import generate_response

logger = logging.getLogger(__name__)

BUFFER_MESSAGE_COUNT = 4  # Last 4 messages (2 full conversation turns: user, assistant, user, assistant)
MIN_MESSAGES_TO_TRIGGER_SUMMARY = 4  # Minimum aged-out messages before triggering a background summary

def assemble_hybrid_memory_history(
    employee_id: str,
    client_history: Optional[List[Any]] = None
) -> List[Dict[str, str]]:
    """
    Assemble the conversation turns to send to Gemini using the Hybrid Memory Strategy:
    1. Check SQLite for existing Long-Term Conversation Summary.
    2. Retrieve the most recent short-term messages (Tier A).
    3. If a summary exists, inject it as the first context turn so the model retains long-range context.
    """
    # 1. Fetch recent short-term buffer (Tier A)
    recent_turns: List[Dict[str, str]] = []
    if client_history:
        for msg in client_history[-BUFFER_MESSAGE_COUNT:]:
            role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else "user")
            content = getattr(msg, "content", None) or (msg.get("content") if isinstance(msg, dict) else "")
            recent_turns.append({"role": role, "content": content})
    else:
        past_rows = get_employee_chat_history(employee_id, limit=BUFFER_MESSAGE_COUNT)
        for r in past_rows:
            recent_turns.append({"role": r["role"], "content": r["content"]})

    # 2. Check for Long-Term Summary (Tier B)
    summary_record = get_conversation_summary(employee_id)
    summary_text = summary_record.get("summary", "").strip() if summary_record else ""

    if not summary_text:
        return recent_turns

    # 3. Assemble: inject summary as an introductory context turn before recent turns
    assembled: List[Dict[str, str]] = [
        {
            "role": "user",
            "content": f"[Conversation Context Summary of Earlier Discussions: {summary_text}]"
        },
        {
            "role": "model",
            "content": "Understood. I will keep this background context in mind while continuing our conversation."
        }
    ]
    assembled.extend(recent_turns)
    return assembled

async def update_long_term_summary_task(employee_id: str):
    """
    Background Task: Incrementally updates the long-term summary when older messages age out.
    Runs asynchronously AFTER the response is returned to the user, consuming 0 user wait time.
    """
    try:
        summary_record = get_conversation_summary(employee_id)
        last_id = summary_record.get("last_summarized_id", 0) if summary_record else 0
        current_summary = summary_record.get("summary", "") if summary_record else ""

        # Fetch messages older than the short-term buffer that have not been summarized yet
        unsummarized = get_unsummarized_chat_messages(
            employee_id=employee_id,
            last_summarized_id=last_id,
            exclude_recent_n=BUFFER_MESSAGE_COUNT
        )

        if len(unsummarized) < MIN_MESSAGES_TO_TRIGGER_SUMMARY:
            # Not enough aged-out messages to justify an LLM call yet (saves free-tier quota)
            return

        new_max_id = max(m["id"] for m in unsummarized)

        # Format older messages for summarization
        formatted_dialogue = []
        for m in unsummarized:
            speaker = "Employee" if m["role"] == "user" else "HR Assistant"
            formatted_dialogue.append(f"{speaker}: {m['content']}")

        dialogue_text = "\n".join(formatted_dialogue)

        summary_prompt = (
            f"Previous Conversation Summary: {current_summary or 'None'}\n\n"
            f"New Earlier Dialogue Turns to Incorporate:\n{dialogue_text}\n\n"
            "Task: Update the running conversation summary in 1 to 3 concise, factual sentences. "
            "Highlight key topics discussed (e.g. leave types, rules queried, employee situation, and outcomes). "
            "Do not include conversational greetings. Only record factual HR context."
        )

        system_inst = "You are a concise enterprise conversation summarizer. Distill dialogue turns into factual, high-density summaries."

        new_summary = await generate_response(
            prompt=summary_prompt,
            system_instruction=system_inst
        )

        if new_summary and not new_summary.startswith("I am sorry"):
            save_conversation_summary(
                employee_id=employee_id,
                summary=new_summary.strip(),
                last_summarized_id=new_max_id
            )
            logger.info(f"Updated long-term conversation summary for employee {employee_id}.")

    except Exception as e:
        logger.warning(f"Background summarization task encountered non-fatal error: {e}")

