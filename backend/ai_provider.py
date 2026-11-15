
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from google import genai
import time
from google.genai import types


# Load the project-root environment file.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=False)

AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").strip().lower()
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.1-flash-lite"
).strip()


@lru_cache(maxsize=1)
def get_ai_client():
    if AI_PROVIDER != "gemini":
        raise RuntimeError(
            f"Unsupported AI provider: {AI_PROVIDER}"
        )

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured on the backend."
        )

    return genai.Client(api_key=api_key)


def generate_ai_response(prompt: str) -> str:
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("AI prompt cannot be empty.")

    client = get_ai_client()



    start_time = time.perf_counter()

    response = client.models.generate_content(
    model=GEMINI_MODEL,
    contents=prompt,
    config=types.GenerateContentConfig(
    response_mime_type="application/json",
    thinking_config=types.ThinkingConfig(
        thinking_level=types.ThinkingLevel.LOW
    ),
    max_output_tokens=8192
    )
)
    generation_time = time.perf_counter() - start_time

    print(
        f"[AI PERFORMANCE] Gemini generation: "
        f"{generation_time:.2f} seconds | "
        f"Model: {GEMINI_MODEL} | "
        f"Prompt size: {len(prompt)} characters"
    )

    result = response.text

    finish_reason = "UNKNOWN"

    if response.candidates:
        finish_reason = str(
            response.candidates[0].finish_reason
        )

    print(
        f"[AI DEBUG] Finish reason: {finish_reason} | "
        f"Response characters: {len(result or '')}"
    )

    if not result or not result.strip():
        raise RuntimeError(
            "The AI provider returned an empty response."
        )

    return result.strip()
