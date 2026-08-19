import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import MainLayout from "./components/MainLayout/MainLayout";
import Footer from "./components/Footer/Footer";
import ChatPage from "./pages/ChatPage";

function App() {
  const [page, setPage] = useState("analyzer");
  const [promptStyle, setPromptStyle] = useState("zero_shot");

  return (
    <>
      <Navbar
        page={page}
        onNavigate={setPage}
        promptStyle={promptStyle}
        onPromptStyleChange={setPromptStyle}
      />
      {page === "analyzer" ? (
        <>
          <Hero />
          <MainLayout />
        </>
      ) : (
        <ChatPage
          promptStyle={promptStyle}
          onPromptStyleChange={setPromptStyle}
        />
      )}
      <Footer />
    </>
  );
}

export default App;
