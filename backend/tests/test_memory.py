import pytest
from app.database.db import (
    save_chat_message,
    clear_employee_chat_history,
    save_conversation_summary,
    get_conversation_summary,
    get_unsummarized_chat_messages
)
from app.services.memory_service import assemble_hybrid_memory_history

def test_hybrid_memory_assembly():
    emp_id = "EMP_TEST_MEM"
    clear_employee_chat_history(emp_id)

    # 1. Initially empty
    turns = assemble_hybrid_memory_history(emp_id)
    assert len(turns) == 0

    # 2. Add 2 turns (4 messages)
    save_chat_message(emp_id, "user", "What is my annual leave balance?")
    save_chat_message(emp_id, "assistant", "You have 14 days remaining.")
    save_chat_message(emp_id, "user", "Can I carry forward leave?")
    save_chat_message(emp_id, "assistant", "Yes, up to 5 days before March 31.")

    turns = assemble_hybrid_memory_history(emp_id)
    assert len(turns) == 4
    assert turns[0]["role"] == "user"
    assert "annual leave balance" in turns[0]["content"]

    # 3. Add long-term summary
    save_conversation_summary(emp_id, "Employee discussed 14-day leave balance and 5-day carryover.", 2)
    summary_record = get_conversation_summary(emp_id)
    assert summary_record is not None
    assert "14-day leave" in summary_record["summary"]

    # 4. Assembled history now includes summary turn + verbatim turns
    turns_with_summary = assemble_hybrid_memory_history(emp_id)
    assert len(turns_with_summary) == 6  # 2 summary turns + 4 verbatim turns
    assert "[Conversation Context Summary" in turns_with_summary[0]["content"]

    # 5. Clear history also clears summary
    clear_employee_chat_history(emp_id)
    assert get_conversation_summary(emp_id) is None
    assert len(assemble_hybrid_memory_history(emp_id)) == 0

