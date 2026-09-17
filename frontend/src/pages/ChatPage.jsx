import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FiArrowUp, FiMessageCircle } from "react-icons/fi";

import { analyzeConversation } from "../services/api";
import { showError } from "../utils/toastUtils";
import "./ChatPage.css";

const styles = [
  { id: "zero_shot", label: "Zero-shot Q&A", detail: "Direct answers, no example supplied." },
  { id: "one_shot", label: "One-shot analogy", detail: "Explains with one helpful analogy." },
  { id: "deep_reasoning", label: "Deep explanation", detail: "Structured reasoning summary and trade-offs." },
];

function ChatPage({ promptStyle, onPromptStyleChange }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const content = question.trim();
    if (!content || loading) return;

    setQuestion("");
    setMessages((items) => [...items, { role: "user", content }]);
    setLoading(true);
    try {
      const response = await analyzeConversation(content, sessionId, promptStyle);
      setSessionId(response.session_id);
      setMessages((items) => [...items, { role: "assistant", ...response }]);
    } catch {
      showError("The chatbot could not reach the backend. Please try again.");
      setMessages((items) => [...items, {
        role: "assistant",
        content: "I couldn't generate a response right now. Please try again.",
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="chat-page">
      <section className="chat-intro">
        <span className="eyebrow"><FiMessageCircle /> Context-aware assistant</span>
        <h1>Ask, explore, and follow up.</h1>
        <p>Each conversation keeps its recent context and retrieves relevant Python guidance for every new question.</p>
      </section>

      <section className="style-cards" aria-label="Prompt styles">
        {styles.map((style) => (
          <button
            key={style.id}
            className={promptStyle === style.id ? "style-card selected" : "style-card"}
            onClick={() => onPromptStyleChange(style.id)}
          >
            <strong>{style.label}</strong>
            <span>{style.detail}</span>
          </button>
        ))}
      </section>

      <section className="chat-shell" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <h2>How can I help?</h2>
            <p>Try “Why does this Python traceback happen?” or ask a follow-up after an answer.</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                <span className="message-label">{message.role === "user" ? "You" : "Assistant"}</span>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {message.source_details?.length > 0 && (
                  <details className="message-sources">
                    <summary>Retrieved sources ({message.source_details.length})</summary>
                    {message.source_details.map((source) => (
                      <p key={source.citation_id}><strong>{source.filename}</strong> — {source.excerpt}</p>
                    ))}
                  </details>
                )}
              </article>
            ))}
            {loading && <div className="chat-typing"><span></span><span></span><span></span></div>}
          </div>
        )}

        <div className="chat-composer">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message the assistant…"
            rows="1"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={!question.trim() || loading} aria-label="Send message">
            <FiArrowUp />
          </button>
        </div>
      </section>
    </main>
  );
}

export default ChatPage;
