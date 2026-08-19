import json
from typing import Tuple

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.request_models import ChatRequest, ConversationRequest
from app.models.response_models import ChatResponse, ConversationResponse, SourceReference

from app.rag.retriever import Retriever
from app.rag.context_builder import ContextBuilder
from app.core.prompt_manager import PromptManager
from app.services.llm_service import LLMService
from app.services.input_classifier import InputClassifier
from app.services.conversation_store import conversation_store

from app.core.logger import logger


router = APIRouter()


def _retrieve_context(question: str) -> Tuple[object, list, list, str]:
    """Run shared classification/retrieval work for blocking and SSE routes."""
    input_type = InputClassifier.classify(question)
    logger.info("Detected input type: %s", input_type.value)

    documents = Retriever().retrieve(question)
    sources = []
    source_details = []
    for doc in documents:
        metadata = doc.metadata
        filename = metadata.get("filename") or metadata.get("source", "Unknown").replace("\\", "/").split("/")[-1]
        if filename not in sources:
            sources.append(filename)

        source_details.append(
            SourceReference(
                citation_id=metadata.get("citation_id", "unknown-source"),
                filename=filename,
                category=metadata.get("category", "unknown"),
                chunk_id=str(metadata.get("chunk_id", "unknown")),
                excerpt=doc.page_content.strip()[:500],
            )
        )

    logger.info("Retrieved %s documents.", len(documents))
    context = ContextBuilder().build_context(documents)
    return input_type, sources, source_details, context


def _event(name: str, data: object) -> str:
    return f"event: {name}\ndata: {json.dumps(data)}\n\n"


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    question = request.question

    logger.info("Received chat input (%s characters).", len(question))

    try:

        input_type, sources, source_details, context = _retrieve_context(question)

        logger.info(
            "Building prompt."
        )

        # Build prompt based on detected input type
        prompt = PromptManager.build_prompt(
            input_type=input_type,
            user_input=question,
            context=context
        )

        logger.info(
            "Sending prompt to LLM."
        )

        answer = LLMService().generate_response(prompt)

        logger.info(
            "Response generated successfully."
        )

        return ChatResponse(
            answer=answer,
            sources=sources,
            source_details=source_details,
        )

    except RuntimeError as e:

        logger.exception(
            "LLM service error."
        )

        raise HTTPException(
            status_code=503,
            detail="The AI service is temporarily unavailable. Please try again shortly."
        ) from e

    except Exception as e:

        logger.exception(
            "Unexpected server error."
        )

        raise HTTPException(
            status_code=500,
            detail="Internal server error."
        ) from e


@router.post("/chat/conversation", response_model=ConversationResponse)
def conversation(request: ConversationRequest):
    """Additive, process-local follow-up chat endpoint."""
    try:
        session_id = conversation_store.ensure_session(request.session_id)
        input_type, sources, source_details, context = _retrieve_context(request.question)
        prompt = PromptManager.build_conversation_prompt(
            input_type=input_type,
            user_input=request.question,
            context=context,
            history=conversation_store.history(session_id),
            prompt_style=request.prompt_style,
        )
        answer = LLMService().generate_response(prompt)
        conversation_store.append(session_id, "user", request.question)
        conversation_store.append(session_id, "assistant", answer)
        return ConversationResponse(
            answer=answer,
            sources=sources,
            source_details=source_details,
            session_id=session_id,
        )
    except RuntimeError as e:
        logger.exception("Conversation AI service error.")
        raise HTTPException(status_code=503, detail="The AI service is temporarily unavailable.") from e
    except Exception as e:
        logger.exception("Conversation server error.")
        raise HTTPException(status_code=500, detail="Internal server error.") from e


@router.post("/chat/stream")
def chat_stream(request: ChatRequest):
    """SSE alternative to /chat; emits metadata, token, done, and error events."""

    def generate():
        try:
            input_type, sources, source_details, context = _retrieve_context(request.question)
            prompt = PromptManager.build_prompt(input_type, request.question, context)
            yield _event("meta", {
                "sources": sources,
                "source_details": [detail.model_dump() for detail in source_details],
            })
            for token in LLMService().generate_response_stream(prompt):
                yield _event("token", {"text": token})
            yield _event("done", {})
        except Exception:
            logger.exception("Streaming chat failed.")
            yield _event("error", {"detail": "The AI service is temporarily unavailable. Please try again."})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
