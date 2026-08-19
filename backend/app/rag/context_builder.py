from pathlib import Path
from typing import List

from langchain_core.documents import Document


class ContextBuilder:
    """
    Converts retrieved LangChain documents into a clean
    context string that can be passed to the LLM.
    """

    def __init__(self, max_context_chars: int = 12000):
        self.max_context_chars = max_context_chars

    def build_context(self, documents: List[Document]) -> str:
        """
        Builds formatted context from retrieved documents.
        """

        if not documents:
            return "No relevant context found."

        context_parts = []
        current_size = 0

        for document in documents:

            source = document.metadata.get("source", "Unknown Source")

            filename = Path(source).name
            citation_id = document.metadata.get("citation_id", "unknown-source")

            content = document.page_content.strip()


            block = (
                f"========== Retrieved Source ==========\n"
                f"Filename: {filename}\n"
                f"Source ID: {citation_id}\n"
                f"======================================\n\n"
                f"{content}\n\n"
                f"{'-' * 50}\n"
            )

            if current_size + len(block) > self.max_context_chars:
                break

            context_parts.append(block)
            current_size += len(block)

        return "\n".join(context_parts)
