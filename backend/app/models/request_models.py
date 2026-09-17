from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=50_000)


class ConversationRequest(ChatRequest):
    """A follow-up request. Omit session_id to start a new conversation."""

    session_id: Optional[str] = Field(default=None, max_length=128)
    prompt_style: Literal["zero_shot", "one_shot", "deep_reasoning"] = "zero_shot"
