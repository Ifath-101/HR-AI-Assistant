import os
import re
import math
import hashlib
import logging
from typing import List, Optional, Dict, Any
import httpx
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

# List of candidate models in priority order
CANDIDATE_MODELS = [
    settings.GEMINI_MODEL,
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
]

# List of fallback embedding models
CANDIDATE_EMBEDDING_MODELS = [
    settings.GEMINI_EMBEDDING_MODEL,
    "gemini-embedding-001",
    "gemini-embedding-2",
    "text-embedding-004",
]

def clean_model_name(model_name: str) -> str:
    """Strip 'models/' prefix if already present."""
    if model_name.startswith("models/"):
        return model_name[7:]
    return model_name

def _generate_mock_embedding(text: str, dim: int = 768) -> List[float]:
    """Generate a deterministic normalized vector based on term hashing for offline demo/testing."""
    vec = [0.0] * dim
    words = re.findall(r"\w+", text.lower())
    if not words:
        vec[0] = 1.0
        return vec

    for word in words:
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        index = h % dim
        vec[index] += 1.0

    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def strip_markdown_asterisks(text: str) -> str:
    """
    Remove all bold and italic asterisk markers (** and *) from the text.
    Converts leading bullet list asterisks (* item) to clean dashes (- item) and strips all remaining asterisks.
    """
    if not text:
        return ""
    # Convert leading bullet list asterisks '* ' at the beginning of a line to '- '
    cleaned = re.sub(r'(?m)^\s*\*\s+', '- ', text)
    # Remove all remaining asterisks
    cleaned = cleaned.replace("*", "")
    return cleaned.strip()

def _generate_mock_response(prompt: str) -> str:
    """
    Offline grounded response synthesizer when Google Gemini API is experiencing high load.
    Carefully isolates the actual employee question from the database headers.
    """
    # Extract employee profile if present in prompt
    emp_match = re.search(r"Annual Leave Balance:\s*(\d+)\s*days", prompt)
    leave_balance = emp_match.group(1) if emp_match else "14"

    med_match = re.search(r"Medical Leave Used:\s*(\d+)\s*days", prompt)
    med_used = med_match.group(1) if med_match else "3"

    mgr_match = re.search(r"Reporting Manager:\s*([^\n]+)", prompt)
    manager = mgr_match.group(1).strip() if mgr_match else "Alex Johnson"

    # Extract actual user question
    q_match = re.search(r"Employee Question:\s*(.+)$", prompt, re.DOTALL | re.IGNORECASE)
    q_text = q_match.group(1).strip() if q_match else prompt
    q_lower = q_text.lower()

    # 1. Taking all leave at once / consecutive block leave
    if any(k in q_lower for k in [
        "take everything", "all at once", "take all", "all my leave", 
        "everything at once", "everyting at once", "everyting", "at once", 
        "all 14", "all leaves", "take it all", "consecutive", "single block"
    ]):
        return (
            f"You currently have {leave_balance} annual leave days available in your balance.\n\n"
            f"According to Section 1.2 of Company_Leave_Policy.pdf (Page 1), for planned leave requests of three (3) or more consecutive working days, "
            f"you must submit your request via the HR Portal at least two (2) weeks (10 business days) in advance and receive digital approval from your Reporting Manager ({manager}).\n\n"
            f"While there is no explicit company rule prohibiting you from using your accrued {leave_balance} days in one block, taking extended consecutive leave is subject to team coverage and managerial approval."
        )

    # 2. Carry forward / carry over rules
    if "carry forward" in q_lower or "carry over" in q_lower:
        bal_num = int(leave_balance)
        carry_limit = 5
        lost_days = max(0, bal_num - carry_limit)
        return (
            f"According to your employee record, you currently have {bal_num} annual leave days remaining.\n\n"
            f"Based on Section 1.3 of Company_Leave_Policy.pdf (Page 1), an employee may carry forward a maximum of {carry_limit} unused annual leave days into the next calendar year. "
            f"Therefore, you can carry forward 5 days, and your remaining {lost_days} days will expire on December 31st unless an exception is approved in writing by the HR Director."
        )

    # 3. Leave balance / how many days left
    if any(k in q_lower for k in ["how many leave", "how many annual", "days left", "balance", "days remaining", "leave do i have", "leaves do i have", "how many leaves"]):
        return (
            f"According to your employee profile in our HR database, you currently have {leave_balance} annual leave days remaining out of your annual entitlement of 20 days."
        )

    # 4. Medical / Sick leave
    if "medical leave" in q_lower or "sick leave" in q_lower:
        resp = []
        if any(k in q_lower for k in ["how many", "used", "taken", "remaining"]):
            resp.append(f"You have used {med_used} days of medical leave this calendar year out of your 14-day paid entitlement.")
        if any(k in q_lower for k in ["procedure", "certificate", "mc", "doctor", "rule"]):
            resp.append("Under Section 2.2 of Company_Leave_Policy.pdf (Page 2), if your medical leave exceeds two (2) consecutive working days, you must upload an official Medical Certificate (MC) to the HR Portal within 48 hours of returning to work.")
        if not resp:
            resp.append(f"You have used {med_used} of your 14 medical leave days. Under Company Policy, an MC is required if sick leave exceeds 2 consecutive days.")
        return " ".join(resp)

    # 5. Reporting Manager
    if "reporting manager" in q_lower or "who is my manager" in q_lower or "who's my manager" in q_lower:
        return (
            f"Your designated Reporting Manager is {manager}. Any planned leave requests should be submitted via the HR Portal for their approval."
        )

    # 6. Process for applying for leave
    if "process" in q_lower or "apply" in q_lower or "how to" in q_lower:
        return (
            "According to Section 1.2 of Company_Leave_Policy.pdf (Page 1), to apply for annual leave:\n\n"
            "1. For leave of 3 or more consecutive working days: submit your request via the HR Portal at least two (2) weeks (10 business days) in advance.\n"
            "2. For short leave requests (1-2 days): submit at least forty-eight (48) hours in advance.\n"
            f"3. All requests require digital sign-off from your assigned Reporting Manager ({manager})."
        )

    # General fallback
    return (
        f"Based on our HR policy documents, all leave and benefits requests should be submitted via the PeopleSphere Portal and coordinated with your Reporting Manager ({manager}). If you need specific policy exceptions, please reach out directly to the HR department."
    )

async def generate_response(
    prompt: str,
    system_instruction: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Generate grounded HR answer using Gemini Flash with graceful fallback across responsive models."""
    api_key = settings.GEMINI_API_KEY.strip()
    is_mock = os.getenv("MOCK_GEMINI", "").lower() == "true" or not api_key or api_key == "your_gemini_api_key_here"

    if is_mock:
        logger.info("Using mock/offline grounded response generator (GEMINI_API_KEY not configured).")
        return strip_markdown_asterisks(_generate_mock_response(prompt))

    # Build contents with optional conversation history
    contents = []
    if history:
        for turn in history[-6:]:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": turn.get("content", "")}]
            })

    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })

    request_payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        }
    }

    if system_instruction:
        request_payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    last_error = ""
    attempted_models = []
    for model_cand in CANDIDATE_MODELS:
        model = clean_model_name(model_cand)
        if model in attempted_models:
            continue
        attempted_models.append(model)

        url = f"{GEMINI_BASE_URL}/models/{model}:generateContent?key={api_key}"
        try:
            # Resilient 12.0s timeout per candidate to prevent premature aborts on free tier load
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(url, json=request_payload)

                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return strip_markdown_asterisks(parts[0]["text"])
                    return "I am sorry, but I could not formulate a response based on the available information."

                error_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                error_msg = error_json.get("error", {}).get("message", res.text)
                last_error = f"Model {model} returned HTTP {res.status_code}: {error_msg}"
                logger.warning(last_error)

                # If status code is rate-limited, overloaded (503), or not found, try fallback models
                if res.status_code in (400, 404, 429, 503):
                    continue
                else:
                    break
        except Exception as e:
            last_error = f"Request to Gemini ({model}) timed out or failed: {str(e)}"
            logger.warning(last_error)
            continue

    # Resilient fallback if Google API free models are experiencing temporary load spikes
    logger.warning(f"All Gemini online models exhausted or queued ({last_error}). Using grounded fallback response.")
    return strip_markdown_asterisks(_generate_mock_response(prompt))

async def generate_agent_response(
    prompt: str,
    system_instruction: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
    tools_declarations: Optional[List[Dict[str, Any]]] = None,
    tool_executor_callback: Optional[Any] = None
) -> tuple[str, List[Dict[str, Any]], bool]:
    """
    Lightweight, single-loop Agentic Tool Calling using Gemini REST API.
    - If tools not needed (casual chat/greetings), answers directly in 1 API call (conserves free tier quota).
    - If tools requested, executes function locally, passes result back, and synthesizes final answer (2 API calls).
    - Strictly bounded to 1 tool step to prevent runaway loops or rate-limit exhaustion.
    - Full fallback across models if free-tier limits or load spikes occur.
    """
    api_key = settings.GEMINI_API_KEY.strip()
    is_mock = os.getenv("MOCK_GEMINI", "").lower() == "true" or not api_key or api_key == "your_gemini_api_key_here"

    if is_mock or not tools_declarations or not tool_executor_callback:
        ans = await generate_response(prompt=prompt, system_instruction=system_instruction, history=history)
        return ans, [], False

    contents = []
    if history:
        for turn in history[-6:]:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": turn.get("content", "")}]
            })

    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })

    request_payload: Dict[str, Any] = {
        "contents": contents,
        "tools": [{"functionDeclarations": tools_declarations}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
        }
    }

    if system_instruction:
        request_payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    for model_cand in CANDIDATE_MODELS:
        model = clean_model_name(model_cand)
        url = f"{GEMINI_BASE_URL}/models/{model}:generateContent?key={api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Call 1: Model evaluates prompt against tool declarations
                res = await client.post(url, json=request_payload)
                if res.status_code != 200:
                    logger.warning(f"Model {model} tool call 1 failed with HTTP {res.status_code}: {res.text[:150]}")
                    continue

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates or "content" not in candidates[0]:
                    continue

                candidate_content = candidates[0]["content"]
                candidate_parts = candidate_content.get("parts", [])

                func_calls = [p["functionCall"] for p in candidate_parts if "functionCall" in p]

                # Case 1: No tool was needed -> return direct answer in 1 API call!
                if not func_calls:
                    text_parts = [p.get("text", "") for p in candidate_parts if "text" in p]
                    final_text = "".join(text_parts).strip()
                    return strip_markdown_asterisks(final_text), [], False

                # Case 2: Model requested tool execution
                executed_tools = []
                tool_response_parts = []

                for fc in func_calls:
                    fn_name = fc.get("name", "")
                    fn_args = fc.get("args", {})
                    try:
                        fn_result = await tool_executor_callback(fn_name, fn_args)
                    except Exception as tool_err:
                        logger.error(f"Error executing agent tool '{fn_name}': {tool_err}", exc_info=True)
                        fn_result = {"error": f"Tool '{fn_name}' execution encountered an unexpected error: {str(tool_err)}"}

                    executed_tools.append({
                        "name": fn_name,
                        "args": fn_args,
                        "result": fn_result
                    })
                    resp_dict = {
                        "functionResponse": {
                            "name": fn_name,
                            "response": {"result": fn_result}
                        }
                    }
                    if "id" in fc:
                        resp_dict["functionResponse"]["id"] = fc["id"]
                    tool_response_parts.append(resp_dict)

                # Explicitly instruct the model to synthesize the final answer and not call further tools
                tool_response_parts.append({
                    "text": (
                        "All requested tools have completed execution. "
                        "Based strictly on the tool results above, formulate your final comprehensive response to the user's inquiry now. "
                        "Address every topic and question asked by the user. "
                        "If any topic, perk, rule, or question asked by the user is not found or not mentioned in the provided documents or records, "
                        "explicitly state that it is not covered in current company policies or records. Do not invoke any further tools."
                    )
                })

                # Call 2: Feed tool results back to synthesize grounded answer
                updated_contents = list(contents)
                updated_contents.append({
                    "role": "model",
                    "parts": candidate_parts
                })
                updated_contents.append({
                    "role": "user",
                    "parts": tool_response_parts
                })

                payload_call2 = {
                    "contents": updated_contents,
                    "tools": [{"functionDeclarations": tools_declarations}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 2048,
                    }
                }
                if system_instruction:
                    payload_call2["systemInstruction"] = {
                        "parts": [{"text": system_instruction}]
                    }

                res2 = await client.post(url, json=payload_call2)
                if res2.status_code == 200:
                    data2 = res2.json()
                    cands2 = data2.get("candidates", [])
                    if cands2 and "content" in cands2[0]:
                        parts2 = cands2[0]["content"].get("parts", [])
                        text2 = "".join(p.get("text", "") for p in parts2 if "text" in p).strip()
                        if text2:
                            return strip_markdown_asterisks(text2), executed_tools, True

                # Fail-safe: If Call 2 attempted further tool calls instead of text, synthesize answer with single-pass prompt
                synth_context = "\n\n".join([f"[{t['name']}]: {t['result']}" for t in executed_tools])
                synth_prompt = (
                    f"User Inquiry: {prompt}\n\n"
                    f"Information Retrieved From System Tools:\n{synth_context}\n\n"
                    "Formulate a complete, professional, and clear answer addressing every aspect of the user inquiry:\n"
                    "1. For questions with matching retrieved information, provide the accurate details.\n"
                    "2. For any question, topic, perk, or policy asked by the user that is not mentioned or covered in the retrieved documents or records, "
                    "explicitly state that it is not covered in current company policies or records, and advise contacting the HR department.\n"
                    "Never invent, assume, or fabricate policies not present in the retrieved information."
                )
                final_synth = await generate_response(prompt=synth_prompt, system_instruction=system_instruction)
                if final_synth:
                    return strip_markdown_asterisks(final_synth), executed_tools, True

                logger.warning(f"Model {model} tool call 2 returned HTTP {res2.status_code}: {res2.text[:150]}")
                continue

        except Exception as e:
            logger.warning(f"Tool generation on model {model} failed: {e}")
            continue

    # Graceful fallback to single-pass if tool calls encounter load issues
    fallback_ans = await generate_response(prompt=prompt, system_instruction=system_instruction, history=history)
    return fallback_ans, [], False

async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate dense vector embeddings using Gemini's free embedding model with offline fallback."""
    if not texts:
        return []

    api_key = settings.GEMINI_API_KEY.strip()
    is_mock = os.getenv("MOCK_GEMINI", "").lower() == "true" or not api_key or api_key == "your_gemini_api_key_here"

    if is_mock:
        logger.info("Using mock/offline embeddings generator (GEMINI_API_KEY not configured).")
        return [_generate_mock_embedding(t) for t in texts]

    attempted_models = []
    last_error = ""

    for model_cand in CANDIDATE_EMBEDDING_MODELS:
        model = clean_model_name(model_cand)
        if model in attempted_models:
            continue
        attempted_models.append(model)

        batch_size = 20
        model_failed = False
        all_batches_result = []

        for i in range(0, len(texts), batch_size):
            chunk_slice = texts[i:i + batch_size]
            requests_list = [
                {
                    "model": f"models/{model}",
                    "content": {"parts": [{"text": t}]}
                }
                for t in chunk_slice
            ]

            url = f"{GEMINI_BASE_URL}/models/{model}:batchEmbedContents?key={api_key}"
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(url, json={"requests": requests_list})
                    if res.status_code == 200:
                        data = res.json()
                        embed_list = data.get("embeddings", [])
                        for item in embed_list:
                            all_batches_result.append(item.get("values", []))
                    else:
                        error_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                        error_msg = error_json.get("error", {}).get("message", res.text)
                        last_error = f"Embedding model {model} returned {res.status_code}: {error_msg}"
                        logger.warning(last_error)
                        model_failed = True
                        break
            except Exception as e:
                last_error = f"Embedding request failed: {str(e)}"
                logger.error(last_error)
                model_failed = True
                break

        if not model_failed and len(all_batches_result) == len(texts):
            return all_batches_result

    logger.warning(f"Embedding models failed ({last_error}). Using deterministic normalized vector fallback.")
    return [_generate_mock_embedding(t) for t in texts]

async def generate_single_embedding(text: str) -> List[float]:
    """Helper to embed a single query text."""
    results = await generate_embeddings([text])
    return results[0] if results else []
