//packages
import { Routes, Route } from "react-router-dom";

//Components
import ChatPage from "./components/ChatPage";
import HomePage from "./components/HomePage";

//styles
import "./App.css";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chats" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;
