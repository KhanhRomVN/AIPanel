import React, { useState, useEffect, useRef } from "react";

interface Message {
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

export default function SidePanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadMessages();
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["aiPanelMessages"], (result) => {
        if (result.aiPanelMessages && result.aiPanelMessages.length > 0) {
          setMessages(result.aiPanelMessages);
        }
      });
    }
  };

  const saveMessages = (newMessages: Message[]) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({
        aiPanelMessages: newMessages.slice(-50),
      });
    }
  };

  const sendToDeepSeek = async (userInput: string): Promise<string | null> => {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              action: "sendToDeepSeek",
              userInput: userInput,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error sending to DeepSeek:",
                  chrome.runtime.lastError
                );
                resolve(null);
              } else {
                resolve(response?.response || null);
              }
            }
          );
        });
      }
      return null;
    } catch (error) {
      console.error("Error in sendToDeepSeek:", error);
      return null;
    }
  };

  const simulateAIResponse = async (): Promise<string> => {
    const responses = [
      "Xin chào! Tôi là AI assistant. Tôi có thể giúp gì cho bạn?",
      "Tôi hiểu câu hỏi của bạn. Bạn có thể cung cấp thêm thông tin không?",
      "Đây là một câu hỏi thú vị. Tôi sẽ cố gắng hỗ trợ bạn tốt nhất có thể.",
      "Cảm ơn bạn đã chia sẻ. Tôi đang xử lý thông tin này...",
      "Tôi có thể giúp bạn với nhiều chủ đề khác nhau. Hãy cho tôi biết bạn cần hỗ trợ gì!",
    ];

    const delay = Math.random() * 1000 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isProcessing) return;

    const userMessage: Message = {
      text: message,
      sender: "user",
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsProcessing(true);

    try {
      const deepSeekResponse = await sendToDeepSeek(message);
      const aiText = deepSeekResponse || (await simulateAIResponse());

      const aiMessage: Message = {
        text: aiText,
        sender: "ai",
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        sender: "ai",
        timestamp: Date.now(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } finally {
      setIsProcessing(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <div className="bg-[#2d2d2d] px-4 py-4 border-b border-[#404040]">
        <h1 className="text-lg font-semibold">AIPanel</h1>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Chào mừng đến với AIPanel!
            <br />
            Hãy bắt đầu trò chuyện với AI.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] px-4 py-3 rounded-xl break-words ${
                msg.sender === "user"
                  ? "self-end bg-[#007acc] text-white"
                  : "self-start bg-[#2d2d2d] border border-[#404040]"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
        {isProcessing && (
          <div className="self-start bg-[#2d2d2d] border border-[#404040] px-4 py-3 rounded-xl text-gray-400 italic">
            AI đang trả lời...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#2d2d2d] px-4 py-4 border-t border-[#404040]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="Nhập tin nhắn của bạn..."
            className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded-lg px-3 py-3 text-white text-sm resize-none min-h-[44px] max-h-[120px] focus:outline-none focus:border-[#007acc] disabled:opacity-50"
            rows={1}
            style={{
              height: "auto",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !inputValue.trim()}
            className="bg-[#007acc] hover:bg-[#005a9e] disabled:bg-[#404040] disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium min-w-[60px]"
          >
            {isProcessing ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}
