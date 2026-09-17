import axios from "axios";

console.log("API URL:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const analyzeCode = async (code) => {
  const response = await api.post("/chat", {
    question: code,
  });

  return response.data;
};

export const analyzeConversation = async (question, sessionId, promptStyle = "zero_shot") => {
  const response = await api.post("/chat/conversation", {
    question,
    session_id: sessionId || undefined,
    prompt_style: promptStyle,
  });
  return response.data;
};

export async function analyzeCodeStream(code, { onMeta, onToken, onError }) {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: code }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to start response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleEvent = (rawEvent) => {
    const event = rawEvent.match(/^event: (.+)$/m)?.[1];
    const data = rawEvent.match(/^data: (.+)$/m)?.[1];
    if (!event || !data) return;
    const payload = JSON.parse(data);
    if (event === "meta") onMeta?.(payload);
    if (event === "token") onToken?.(payload.text);
    if (event === "error") onError?.(payload.detail);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop();
    events.forEach(handleEvent);
    if (done) break;
  }
}

export default api;
