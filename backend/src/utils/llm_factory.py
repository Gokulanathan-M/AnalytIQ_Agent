from langchain_google_genai import ChatGoogleGenerativeAI
from src.core.config import settings


def get_llm(temperature: float = 0.2) -> ChatGoogleGenerativeAI:
    """
    Returns a configured Gemini 2.5 Flash LLM instance.
    Temperature is kept low (0.1-0.2) by default for data analysis tasks
    to ensure deterministic, accurate code and analytical output.
    """
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.gemini_api_key,
        temperature=temperature,
    )
