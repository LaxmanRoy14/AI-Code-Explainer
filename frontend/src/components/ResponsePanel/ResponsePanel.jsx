import ReactMarkdown from "react-markdown";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

import "./ResponsePanel.css";
import "./MarkdownStyles.css";

import MarkdownCodeBlock from "../MarkdownCodeBlock/MarkdownCodeBlock";

import DownloadButton from "../DownloadButton/DownloadButton";

import { FiCode, FiAlertCircle } from "react-icons/fi";

function ResponsePanel({ response, loading, streaming }) {
  if (loading && !streaming) {
    return <LoadingSpinner />;
  }

  return (
    <div className="response-container">
      {response && !response.error && (
        <div className="response-toolbar">
          <DownloadButton content={response.answer} />
        </div>
      )}

      {response ? (
        response.error ? (
          <div className="error-state">
            <FiAlertCircle className="error-icon" />

            <h3>Unable to Analyze Code</h3>

            <p>{response.answer}</p>

            <small>
              Please make sure the backend server is running and try again.
            </small>
          </div>
        ) : (
          <>
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  a({ href, children, ...props }) {
                    const isCitation = href?.startsWith("#source-");
                    return (
                      <a
                        href={href}
                        className={isCitation ? "source-citation" : undefined}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");

                    if (match) {
                      return (
                        <MarkdownCodeBlock
                          language={match[1]}
                          code={String(children).replace(/\n$/, "")}
                        />
                      );
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {response.answer}
              </ReactMarkdown>
            </div>

            {response.source_details && response.source_details.length > 0 ? (
              <div className="sources-section">
                <h3>Retrieved Sources</h3>

                <div className="sources-list">
                  {response.source_details.map((source) => (
                    <article
                      key={source.citation_id}
                      id={`source-${source.citation_id}`}
                      className="source-card"
                    >
                      <strong>{source.filename}</strong>
                      <span>{source.category} · {source.chunk_id}</span>
                      <p>{source.excerpt}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : response.sources && response.sources.length > 0 ? (
              <div className="sources-section">
                <h3>Sources Used</h3>
                <div className="sources-list">
                  {response.sources.map((source, index) => (
                    <span key={index} className="source-chip">{source}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )
      ) : (
        <div className="placeholder">
          <FiCode className="placeholder-icon" />

          <h3>Ready to Analyze Your Code</h3>

          <p>
            Paste your Python code into the editor and click
            <strong> Analyze Code </strong>
            to receive an AI-powered explanation, debugging suggestions, and
            best practices.
          </p>

          <div className="example-prompts">
            <span>✓ Explain this function</span>
            <span>✓ Find syntax errors</span>
            <span>✓ Debug runtime issues</span>
            <span>✓ Suggest improvements</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResponsePanel;
