import { useState, useEffect, useRef } from "react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import "./App.css";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// AWS Polly 클라이언트 초기화
const pollyClient = new PollyClient({
  region: "ap-northeast-2", // 서울 리전
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
});

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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

          // 간단한 응답 생성
          setTimeout(() => {
            const responses = [
              "그렇군요. 그때 어떤 감정이 드셨나요?",
              "힘드셨겠네요. 그 상황에서 어떻게 대처하셨어요?",
              "그런 경험이 있으셨군요. 지금은 어떠신가요?",
              "많이 속상하셨겠어요. 더 자세히 말씀해 주시겠어요?",
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

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setCurrentTranscript("");
      };

      recognitionRef.current = recognition;
    }

    // Audio 엘리먼트 생성
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsSpeaking(false);
    };
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

  const handleSpeak = async () => {
    if (!audioRef.current) return;

    // 이미 말하고 있다면 중지
    if (isSpeaking) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      return;
    }

    // 상담사 메시지만 추출
    const counselorMessages = messages
      .filter((msg) => !msg.isUser)
      .map((msg) => msg.text)
      .join(" ");

    if (counselorMessages) {
      try {
        const command = new SynthesizeSpeechCommand({
          Engine: "neural",
          LanguageCode: "ko-KR",
          Text: counselorMessages,
          OutputFormat: "mp3",
          VoiceId: "Seoyeon", // AWS Polly의 한국어 신경망 음성
          TextType: "text",
        });

        const response = await pollyClient.send(command);

        if (response.AudioStream) {
          // AudioStream을 Blob으로 변환
          const blob = new Blob(
            [await response.AudioStream.transformToByteArray()],
            { type: "audio/mpeg" }
          );
          const url = URL.createObjectURL(blob);

          // Audio 엘리먼트에 설정하고 재생
          audioRef.current.src = url;
          audioRef.current.play();
          setIsSpeaking(true);

          // 재생이 끝나면 URL 해제
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(url);
          };
        }
      } catch (error) {
        console.error("Polly synthesis error:", error);
        setIsSpeaking(false);
      }
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
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                fill={
                  isRecording ? "#dc3545" : isSupported ? "#0066ff" : "#999"
                }
              />
              <path
                d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                fill={
                  isRecording ? "#dc3545" : isSupported ? "#0066ff" : "#999"
                }
              />
            </svg>
          </button>
          <button
            className={`speaker-btn${isSpeaking ? " speaking" : ""}`}
            onClick={handleSpeak}
            aria-label={isSpeaking ? "음성 중지" : "상담 내용 듣기"}
            disabled={messages.length === 0}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                fill={
                  isSpeaking
                    ? "#0066ff"
                    : messages.length === 0
                    ? "#999"
                    : "#666"
                }
              />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
