import { useState, useEffect, useRef } from "react";
import "./App.css";

// SpeechRecognition 타입 정의
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 브라우저 지원 확인
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);

      // SpeechRecognition 설정
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ko-KR";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript);

        if (finalTranscript) {
          setMessages((prev) => [
            ...prev,
            { text: finalTranscript, isUser: true },
          ]);
          setCurrentTranscript("");

          // 간단한 응답 생성 (실제로는 AI API를 사용)
          setTimeout(() => {
            const responses = [
              "네, 말씀해주신 내용을 잘 들었습니다. 더 자세히 말씀해 주시겠어요?",
              "그런 감정을 느끼셨군요. 언제부터 그런 기분이 드셨나요?",
              "충분히 이해됩니다. 그때 어떤 생각이 드셨나요?",
              "힘드셨을 것 같아요. 그 상황에서 어떻게 대처하셨나요?",
            ];
            const randomResponse =
              responses[Math.floor(Math.random() * responses.length)];
            setMessages((prev) => [
              ...prev,
              { text: randomResponse, isUser: false },
            ]);
          }, 1000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setCurrentTranscript("");
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleStartRecording = () => {
    if (recognitionRef.current && isSupported) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="voice-app-wrapper">
      <header className="voice-header">
        <h1>음성 심리상담</h1>
        <p className="subtitle">마음을 편하게 나누어보세요</p>
      </header>
      {!isSupported && (
        <div className="voice-warning">
          <span role="img" aria-label="경고">
            ⚠️
          </span>{" "}
          이 브라우저는 음성 인식을 지원하지 않습니다.{" "}
          <b>Chrome, Edge, Safari</b>를 사용해주세요.
        </div>
      )}
      <main className="voice-main">
        {messages.length === 0 && !currentTranscript ? (
          <div className="voice-greeting">
            안녕하세요! 저는 당신의 이야기를 들어드릴 준비가 되어있습니다.
            <br />
            <br />
            아래 마이크 버튼을 눌러 대화를 시작해보세요.
          </div>
        ) : (
          <div className="conversation-area">
            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${
                    message.isUser ? "user-message" : "counselor-message"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {currentTranscript && (
                <div className="message user-message interim">
                  {currentTranscript}
                  <span className="typing-indicator">|</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="voice-controls">
          <button
            className={`mic-btn${isRecording ? " recording" : ""}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            aria-label={isRecording ? "녹음 중지" : "녹음 시작"}
            disabled={!isSupported}
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
                fill={
                  isRecording ? "#dc3545" : isSupported ? "#bcdcff" : "#f3f4f6"
                }
              />
              <path
                d="M12 17c1.66 0 3-1.34 3-3V9a3 3 0 10-6 0v5c0 1.66 1.34 3 3 3z"
                fill={isRecording ? "white" : isSupported ? "#007bff" : "#888"}
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
