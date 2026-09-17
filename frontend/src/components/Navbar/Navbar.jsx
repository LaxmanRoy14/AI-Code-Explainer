import "./Navbar.css";
import { useTheme } from "../../context/ThemeContext";

function Navbar({ page, onNavigate, promptStyle, onPromptStyleChange }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="logo">AI Code Explainer</div>

      <div className="nav-actions">
        <div className="nav-links">
          <button
            className={page === "analyzer" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("analyzer")}
          >
            Code Analyzer
          </button>
          <button
            className={page === "chat" ? "nav-link active" : "nav-link"}
            onClick={() => onNavigate("chat")}
          >
            Chatbot
          </button>
          {page === "chat" && (
            <label className="prompt-style-select">
              <span>Response style</span>
              <select
                value={promptStyle}
                onChange={(event) => onPromptStyleChange(event.target.value)}
              >
                <option value="zero_shot">Zero-shot Q&amp;A</option>
                <option value="one_shot">One-shot analogy</option>
                <option value="deep_reasoning">Deep explanation</option>
              </select>
            </label>
          )}
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
