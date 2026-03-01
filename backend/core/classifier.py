from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
import re
from schemas.analysis import AnalysisResult, DetectedMistake, MistakeTag

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "models/gemini-2.5-flash"

VALID_TAGS = [tag.value for tag in MistakeTag]

SYSTEM_PROMPT = """
You are a strict cognitive mistake classifier for DSA (Data Structures & Algorithms) problems.
Your ONLY job is to analyze a user's code and classify which cognitive mistake types are present.

You must return ONLY valid JSON. No explanation, no markdown, no extra text.

VALID MISTAKE TAGS (use ONLY these exact strings):
- missed_edge_case
- off_by_one_error
- incorrect_loop_boundary
- unnecessary_nested_loop
- base_condition_flaw
- redundant_computation

CLASSIFICATION RULES:
1. Only include a tag if confidence_score >= 0.70
2. Only pick from the valid tags above — never invent new ones
3. reasoning_summary must reference specific lines or logic from the user's actual code
4. If no mistakes found, return empty arrays
5. line_reference is optional but include it when clearly identifiable

RETURN THIS EXACT JSON STRUCTURE:
{
  "detected_mistakes": [
    {
      "tag": "one of the valid tags",
      "confidence_score": 0.0 to 1.0,
      "reasoning_summary": "specific reason referencing the user's code",
      "line_reference": "line X" or null
    }
  ],
  "clean_tags": ["list of tag strings that passed confidence threshold"]
}
"""

def build_user_prompt(problem_description: str, code: str, language: str) -> str:
    return f"""
PROBLEM STATEMENT:
{problem_description}

USER'S CODE ({language}):
{code}

Classify the cognitive mistakes in this code strictly using the rules provided.
"""

def validate_and_parse(raw_json: dict) -> AnalysisResult:
    detected = []

    for item in raw_json.get("detected_mistakes", []):
        tag_value = item.get("tag")
        confidence = item.get("confidence_score", 0)

        if tag_value not in VALID_TAGS:
            continue
        if confidence < 0.70:
            continue

        detected.append(DetectedMistake(
            tag=MistakeTag(tag_value),
            confidence_score=confidence,
            reasoning_summary=item.get("reasoning_summary", ""),
            line_reference=item.get("line_reference", None)
        ))

    clean_tags = [m.tag for m in detected]

    return AnalysisResult(
        detected_mistakes=detected,
        clean_tags=clean_tags
    )

def classify_code(problem_description: str, code: str, language: str = "python") -> AnalysisResult:
    prompt = build_user_prompt(problem_description, code, language)
    full_prompt = SYSTEM_PROMPT + "\n" + prompt

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json"
                )
            )

            raw_text = response.text.strip()
            raw_text = re.sub(r"^```json|^```|```$", "", raw_text, flags=re.MULTILINE).strip()

            raw_json = json.loads(raw_text)
            return validate_and_parse(raw_json)

        except json.JSONDecodeError:
            if attempt == 1:
                return AnalysisResult(detected_mistakes=[], clean_tags=[])
            continue

        except Exception as e:
            print(f"Classifier error (attempt {attempt + 1}): {e}")
            if attempt == 1:
                return AnalysisResult(detected_mistakes=[], clean_tags=[])
            continue