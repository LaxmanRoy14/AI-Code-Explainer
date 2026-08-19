import { useState } from "react";
import Editor from "@monaco-editor/react";

import "./CodeEditor.css";

import {
  analyzeCode,
  analyzeCodeStream,
} from "../../services/api";

import { useTheme } from "../../context/ThemeContext";

import { showSuccess, showError, showWarning } from "../../utils/toastUtils";

function CodeEditor({
  onResponse,
  loading,
  setLoading,
  setStreaming,
}) {
  const [code, setCode] = useState(`# Write your Python code here

def greet(name):
    print(f"Hello, {name}")

greet("Alice")
`);

  const { theme } = useTheme();
  const [streamResponse, setStreamResponse] = useState(false);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      showWarning("Please enter some Python code first.");
      return;
    }

    try {
      setLoading(true);

      let result;
      if (streamResponse) {
        setStreaming(true);
        onResponse({ answer: "", sources: [], source_details: [] });
        let streamError = null;
        await analyzeCodeStream(code, {
          onMeta: ({ sources, source_details }) => {
            onResponse((current) => ({
              ...(current || {}),
              sources,
              source_details,
            }));
          },
          onToken: (text) => {
            onResponse((current) => ({
              ...(current || {}),
              answer: `${current?.answer || ""}${text}`,
            }));
          },
          onError: (detail) => {
            streamError = detail;
          },
        });
        if (streamError) throw new Error(streamError);
        result = null;
      } else {
        result = await analyzeCode(code);
      }

      if (result) onResponse(result);

      showSuccess("Analysis completed successfully!");
    } catch (error) {
      onResponse({
        answer: "Failed to connect to backend.",
        sources: [],
        error: true,
      });

      if (error.response) {
        showError("Backend returned an error.");
      } else {
        showError("Unable to connect to the backend.");
      }
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    onResponse(null);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleAnalyze();
    });
  };

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <label htmlFor="language">Language</label>

          <select
            id="language"
            className="language-select"
            defaultValue="python"
          >
            <option value="python">Python</option>
          </select>

        </div>

        <div className="toolbar-right">
          <label className="stream-toggle">
            <input
              type="checkbox"
              checked={streamResponse}
              onChange={(event) => setStreamResponse(event.target.checked)}
              disabled={loading}
            />
            Stream
          </label>
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
            aria-label="Analyze Python code"
          >
            {loading ? "Analyzing..." : "Analyze Code"}
          </button>

          <button
            className="clear-btn"
            onClick={handleClear}
            disabled={loading}
            aria-label="Clear editor"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language="python"
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: {
              enabled: false,
            },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
