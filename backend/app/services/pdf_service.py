from typing import List, Dict, Any
import re
import fitz  # PyMuPDF
from fastapi import HTTPException

def sanitize_extracted_text(text: str) -> str:
    """
    Sanitize text to defend against prompt injection vectors and invisible token cloaking:
    - Strips non-printable ASCII control characters.
    - Strips Unicode zero-width characters (used to smuggle hidden prompt text).
    - Strips Unicode bidirectional overrides (used to disguise instruction tokens).
    Preserves all standard punctuation, alphanumeric characters, and line breaks.
    """
    if not text:
        return ""
    # Strip null bytes and non-printable control characters (except newline, carriage return, and tab)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Strip Unicode zero-width and directional override characters
    text = re.sub(r"[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]", "", text)
    return text

def is_section_header(line_text: str, avg_size: float, baseline_size: float) -> bool:
    """
    Determine if a line of text represents a major section header or structural divider.
    Combines font-size heuristics, numbering patterns, and structural keywords.
    """
    text = line_text.strip()
    if not text:
        return False

    # Exclude company letterheads, footers, page counters
    if "APEX GLOBAL TECHNOLOGIES" in text.upper():
        return False
    if re.search(r"Page\s+\d+\s+of\s+\d+", text, re.IGNORECASE):
        return False
    if re.match(r"^Apex Global Technologies\s*•", text, re.IGNORECASE):
        return False

    # Exclude lines ending with full sentence punctuation (bullet steps, sentences)
    if text.endswith(('.', ';', ',')):
        return False

    # Exclude table cell values (numbers, hours, durations, currencies)
    if re.match(r"^\d+[\s\w–\-\(\)\/\$%\.]+$", text) and not re.match(r"^\d+[\.\)]\s+[A-Za-z0-9]", text):
        return False
    if text in ("Tenure", "Category", "Annual Total", "Days", "Hours", "Accrual Per Pay Period", "Maximum Carryover to Next", "Year"):
        return False

    # Rule 1: Numbered major section: "1. Paid Time Off", "2. Step-by-Step", "4. 2026 Official..."
    if re.match(r"^\s*\d+(\.\d+)*[\.\)]\s+[A-Za-z0-9][^\n]{2,90}$", text):
        if avg_size >= (baseline_size + 0.8) or not re.match(r"^\s*\d+[\.\)]\s+(Log|Click|Select|Enter|Attach|Your|Please|Make|Do)\b", text):
            return True

    # Rule 2: Named policy block: "POLICY DOCUMENT AGT-LEV-003", "SECTION 3: BENEFITS"
    if re.match(r"^(POLICY DOCUMENT|SECTION|ARTICLE|CHAPTER|PART|APPENDIX)\s+[A-Z0-9\.\-:]+", text, re.IGNORECASE):
        return True

    # Rule 3: Known structural subsection like "How to Submit via the Workday HR Portal:"
    if re.match(r"^(How to Submit|Summary Plan Descriptions|Tier \d+\s*[-—]|Escalation Pathways|Eligibility & Accrual Rules)[^:\n]{0,80}:?$", text, re.IGNORECASE):
        return True

    # Rule 4: Distinctly large title/header font (at least 2.0pt above body size, short title line)
    if avg_size >= (baseline_size + 2.0) and len(text) < 80:
        if re.search(r"[A-Za-z]{3,}", text):
            return True

    return False

def extract_text_and_chunks_from_pdf(
    file_bytes: bytes,
    filename: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Section-Aware PDF Chunker:
    Extracts text per page from PDF using PyMuPDF and groups content by section headings.
    - Inspects typography and numbering to detect section headers.
    - Keeps small sections intact as atomic chunks to preserve rule boundaries.
    - Injects breadcrumbs ('[Policy > Section]') into every chunk for high-relevance retrieval.
    - Splits large sections gracefully respecting sentence boundaries.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF file: {str(e)}")

    if doc.page_count == 0:
        raise HTTPException(status_code=400, detail="The uploaded PDF contains no pages.")

    doc_title = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').strip()

    # Step 1: Detect baseline body font size across document
    all_font_sizes = []
    total_extracted_text = ""
    for page in doc:
        p_dict = page.get_text("dict")
        for b in p_dict.get("blocks", []):
            if "lines" in b:
                for l in b["lines"]:
                    spans = [s for s in l.get("spans", []) if s.get("text", "").strip()]
                    if spans:
                        all_font_sizes.append(sum(s.get("size", 10.0) for s in spans) / len(spans))

    baseline_size = 9.5
    if all_font_sizes:
        all_font_sizes.sort()
        baseline_size = all_font_sizes[len(all_font_sizes) // 2]

    # Step 2: Extract text grouped into semantic sections
    sections = []
    current_section = "General Overview"
    current_lines = []
    section_page = 1

    for p_idx, page in enumerate(doc):
        page_num = p_idx + 1
        page_text = page.get_text("text").strip()
        if page_text:
            total_extracted_text += page_text + "\n"

        p_dict = page.get_text("dict")
        for b in p_dict.get("blocks", []):
            if "lines" not in b:
                continue
            for line in b["lines"]:
                raw_line = "".join([s.get("text", "") for s in line.get("spans", [])]).strip()
                line_text = sanitize_extracted_text(raw_line)
                if not line_text:
                    continue
                spans = [s for s in line.get("spans", []) if s.get("text", "").strip()]
                avg_sz = sum(s.get("size", 10.0) for s in spans) / len(spans) if spans else 10.0

                if is_section_header(line_text, avg_sz, baseline_size):
                    if current_lines:
                        sections.append({
                            "section": current_section,
                            "page": section_page,
                            "text": "\n".join(current_lines).strip()
                        })
                        current_lines = []
                    current_section = line_text
                    section_page = page_num
                else:
                    if "APEX GLOBAL TECHNOLOGIES" in line_text.upper():
                        continue
                    if re.match(r"^Apex Global Technologies\s*•", line_text, re.IGNORECASE):
                        continue
                    if re.search(r"Page\s+\d+\s+of\s+\d+", line_text, re.IGNORECASE):
                        continue
                    current_lines.append(line_text)

    if current_lines:
        sections.append({
            "section": current_section,
            "page": section_page,
            "text": "\n".join(current_lines).strip()
        })
    doc.close()

    if not total_extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract any text from the PDF. Scanned image-only PDFs are not supported."
        )

    # Step 3: Produce section-aware chunks with breadcrumb injection
    chunks: List[Dict[str, Any]] = []
    chunk_counter = 0

    for sec in sections:
        sec_title = sec["section"]
        sec_text = sec["text"]
        sec_page = sec["page"]

        if not sec_text:
            continue

        breadcrumb = f"[{doc_title} > {sec_title}]"

        # If section is small enough, retain as a single atomic chunk
        if len(sec_text) <= chunk_size:
            chunk_content = f"{breadcrumb}\n{sec_text}"
            chunks.append({
                "chunk_id": f"{filename}_c{chunk_counter}",
                "text": chunk_content,
                "section": sec_title,
                "page": sec_page,
                "chunk_index": chunk_counter,
                "filename": filename
            })
            chunk_counter += 1
        else:
            # Subdivide section with sentence/newline boundary
            start = 0
            text_len = len(sec_text)
            part_no = 1

            while start < text_len:
                end = min(start + chunk_size, text_len)
                if end < text_len:
                    boundary = max(
                        sec_text.rfind(". ", start, end),
                        sec_text.rfind("\n", start, end)
                    )
                    if boundary != -1 and boundary > start + (chunk_size // 2):
                        end = boundary + 1

                sub_content = sec_text[start:end].strip()
                if sub_content:
                    chunk_content = f"{breadcrumb} (Part {part_no})\n{sub_content}"
                    chunks.append({
                        "chunk_id": f"{filename}_c{chunk_counter}",
                        "text": chunk_content,
                        "section": sec_title,
                        "page": sec_page,
                        "chunk_index": chunk_counter,
                        "filename": filename
                    })
                    chunk_counter += 1
                    part_no += 1

                if end >= text_len:
                    break

                # Advance forward safely with overlap while guaranteeing strictly positive progress
                safe_overlap = min(chunk_overlap, max(1, chunk_size // 2))
                next_start = end - safe_overlap
                if next_start <= start:
                    next_start = start + max(1, chunk_size // 2)
                start = next_start

    return chunks
