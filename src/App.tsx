import { useState } from "react";
import "./App.css";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);

  const handleStartRecording = () => {
    setIsRecording(true);
    // 여기에 음성 녹음 로직이 추가될 예정입니다
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // 여기에 음성 녹음 중지 로직이 추가될 예정입니다
  };

  return (
    <div className="voice-app-wrapper">
      <header className="voice-header">
        <h1>음성 심리상담</h1>
        <p className="subtitle">마음을 편하게 나누어보세요</p>
      </header>
      <div className="voice-warning">
        <span role="img" aria-label="경고">
          ⚠️
        </span>{" "}
        이 브라우저는 음성 인식을 지원하지 않습니다. <b>Chrome, Edge, Safari</b>
        를 사용해주세요.
      </div>
      <main className="voice-main">
        <div className="voice-greeting">
          안녕하세요! 저는 당신의 이야기를 들어드릴 준비가 되어있습니다.
          <br />
          <br />
          아래 마이크 버튼을 눌러 대화를 시작해보세요.
        </div>
        <div className="voice-controls">
          <button
            className={`mic-btn${isRecording ? " recording" : ""}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            aria-label={isRecording ? "녹음 중지" : "녹음 시작"}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="12"
                fill={isRecording ? "#dc3545" : "#bcdcff"}
              />
              <path
                d="M12 17c1.66 0 3-1.34 3-3V9a3 3 0 10-6 0v5c0 1.66 1.34 3 3 3z"
                fill={isRecording ? "white" : "#007bff"}
              />
            </svg>
          </button>
          <button className="speaker-btn" aria-label="상담 내용 듣기" disabled>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="12" fill="#f3f4f6" />
              <path d="M8 15h2.83L15 18.17V5.83L10.83 9H8v6z" fill="#888" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
