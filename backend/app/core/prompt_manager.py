from app.services.input_classifier import InputType


class PromptManager:
    """
    Builds prompts for the LLM based on the detected input type.
    """

    @staticmethod
    def build_prompt(
        input_type: InputType,
        user_input: str,
        context: str,
    ) -> str:

        if input_type == InputType.CODE:
            return PromptManager._build_code_prompt(
                user_input,
                context,
            )

        return PromptManager._build_knowledge_prompt(
            user_input,
            context,
        )

    @staticmethod
    def _build_knowledge_prompt(
        question: str,
        context: str,
    ) -> str:

        return f"""
You are an expert Python Software Engineer and Programming Mentor.

Answer the user's question using the retrieved context as the primary source.

Instructions:

1. Use the retrieved context whenever possible.
2. If the context is incomplete, supplement it with correct Python knowledge.
3. Never invent information about the retrieved documents.
4. Explain concepts clearly.
5. Use Markdown formatting.
6. Include examples when appropriate.
7. Cite each material claim grounded in a retrieved source using this exact
   Markdown form: [source-id](#source-source-id). Source IDs appear beside
   each retrieved source. Do not cite IDs that are not in the context.

==========================
Retrieved Context
==========================

{context}

==========================
User Question
==========================

{question}
"""

    @staticmethod
    def _build_code_prompt(
        code: str,
        context: str,
    ) -> str:

        return f"""
You are a Senior Python Software Engineer, Code Reviewer, and Debugging Expert.

Analyze the user's Python code.

Use the retrieved context whenever it is relevant, but focus primarily on the submitted code.

Provide your response using the following structure:

# Code Summary

Briefly explain what the code is trying to accomplish.

# Line-by-Line Explanation

Explain the important parts of the code.

# Bugs / Issues

Identify:

- Syntax errors
- Runtime errors
- Logical errors
- Edge cases

If no issues exist, clearly state that.

# Suggested Fixes

Provide corrected code if necessary.

# Time Complexity

Analyze the algorithm.

# Space Complexity

Analyze memory usage.

# Best Practices

Suggest improvements following Python best practices and PEP 8.

# Optimized Version

Only provide an optimized version if meaningful improvements exist.

# Citations

For claims that rely on retrieved documentation, cite the source in this exact
Markdown form: [source-id](#source-source-id). Source IDs appear beside each
retrieved source. Do not cite IDs that are not in the context.

## Citation Rules

When a response contains information grounded in the retrieved context:

1. Use the value labeled "Source ID" as the citation ID.
2. Do NOT use the filename as the citation ID.
3. The filename and Source ID are different values.
4. Use this exact Markdown format:

   [Source ID](#source-Source ID)

For example, if the retrieved source contains:

Filename: functions.md
Source ID: src-c1c56e9f50d7

the citation MUST be:

[src-c1c56e9f50d7](#source-src-c1c56e9f50d7)

Do NOT generate:

[functions.md](#source-functions.md)

Only cite Source IDs that actually appear in the retrieved context.

==========================
Retrieved Context
==========================

{context}

==========================
User Code
==========================

{code}
"""

    @staticmethod
    def build_conversation_prompt(
        input_type: InputType,
        user_input: str,
        context: str,
        history: str,
        prompt_style: str = "zero_shot",
    ) -> str:
        """Builds a follow-up prompt while preserving the existing RAG rules."""

        style_instruction = PromptManager._conversation_style_instruction(prompt_style)
        base_prompt = PromptManager.build_prompt(input_type, user_input, context)
        return f"""{base_prompt}

==========================
Conversation History
==========================

{history or "No previous conversation."}

Use the history only to resolve follow-up references. Treat the latest user
input as the request to answer. Do not repeat prior answers unnecessarily.

==========================
Response Style
==========================

{style_instruction}
"""

    @staticmethod
    def _conversation_style_instruction(prompt_style: str) -> str:
        """Constrain the visible response style without requesting hidden reasoning."""
        if prompt_style == "one_shot":
            return """Use an explanatory analogy where it improves understanding.
Follow this compact example pattern once when relevant:
Concept: a Python list
Analogy: a labelled shelf that can grow and change.
Then apply the same concept-and-analogy format to the user's question."""

        if prompt_style == "deep_reasoning":
            return """Give a rigorous, user-facing explanation with: assumptions,
a concise step-by-step solution outline, trade-offs, and a final recommendation.
Do not reveal private chain-of-thought or hidden reasoning; provide only the
useful, verifiable reasoning summary the user needs."""

        return """Answer directly with no supplied examples. Be concise, accurate,
and use the retrieved context for factual claims. This is a zero-shot Q&A response."""
