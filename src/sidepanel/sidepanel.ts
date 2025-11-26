interface Message {
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

class AIPanel {
  private messages: Message[];
  private isProcessing: boolean;
  private messagesContainer: HTMLElement | null | undefined;
  private messageInput: HTMLTextAreaElement | null | undefined;
  private sendButton: HTMLButtonElement | null | undefined;
  private typingIndicator: HTMLElement | null | undefined;

  constructor() {
    this.messages = [];
    this.isProcessing = false;
    this.initializeElements();
    this.setupEventListeners();
    this.loadMessages();
  }

  initializeElements() {
    this.messagesContainer = document.getElementById("messages");
    this.messageInput = document.getElementById(
      "messageInput"
    ) as HTMLTextAreaElement;
    this.sendButton = document.getElementById(
      "sendButton"
    ) as HTMLButtonElement;
    this.typingIndicator = document.getElementById("typingIndicator");
  }

  setupEventListeners() {
    this.sendButton?.addEventListener("click", () => this.sendMessage());
    this.messageInput?.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.messageInput?.addEventListener("input", () => {
      if (this.messageInput) {
        this.messageInput.style.height = "auto";
        this.messageInput.style.height =
          Math.min(this.messageInput.scrollHeight, 120) + "px";
      }
    });

    // Focus input when panel opens
    this.messageInput?.focus();
  }

  async sendMessage() {
    if (!this.messageInput) return;

    const message = this.messageInput.value.trim();
    if (!message || this.isProcessing) return;

    // Add user message
    this.addMessage(message, "user");
    this.messageInput.value = "";
    this.messageInput.style.height = "auto";

    // Disable input while processing
    this.setProcessing(true);

    try {
      // Show typing indicator
      this.showTypingIndicator();

      // Simulate AI response (tạm thời dùng mock response)
      await this.simulateAIResponse(message);
    } catch (error) {
      console.error("Error sending message:", error);
      this.addMessage("Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.", "ai");
    } finally {
      this.hideTypingIndicator();
      this.setProcessing(false);
      this.saveMessages();
    }
  }

  async simulateAIResponse(_userMessage: string) {
    // Tạm thời dùng mock responses
    const responses = [
      "Xin chào! Tôi là AI assistant. Tôi có thể giúp gì cho bạn?",
      "Tôi hiểu câu hỏi của bạn. Bạn có thể cung cấp thêm thông tin không?",
      "Đây là một câu hỏi thú vị. Tôi sẽ cố gắng hỗ trợ bạn tốt nhất có thể.",
      "Cảm ơn bạn đã chia sẻ. Tôi đang xử lý thông tin này...",
      "Tôi có thể giúp bạn với nhiều chủ đề khác nhau. Hãy cho tôi biết bạn cần hỗ trợ gì!",
    ];

    // Random delay để giống thật
    const delay = Math.random() * 1000 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Chọn random response
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    this.addMessage(randomResponse, "ai");
  }

  addMessage(text: string, sender: "user" | "ai") {
    if (!this.messagesContainer) return;

    // Remove welcome message if it's the first real message
    const welcomeMessage =
      this.messagesContainer.querySelector(".welcome-message");
    if (welcomeMessage && this.messages.length === 0) {
      welcomeMessage.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Save to messages array
    this.messages.push({ text, sender, timestamp: Date.now() });
  }

  showTypingIndicator() {
    if (!this.typingIndicator || !this.messagesContainer) return;

    this.typingIndicator.style.display = "block";
    this.messagesContainer.appendChild(this.typingIndicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    if (!this.typingIndicator) return;
    this.typingIndicator.style.display = "none";
  }

  setProcessing(processing: boolean) {
    this.isProcessing = processing;

    if (this.sendButton) {
      this.sendButton.disabled = processing;
    }

    if (this.messageInput) {
      this.messageInput.disabled = processing;
    }

    if (processing) {
      if (this.sendButton) {
        this.sendButton.textContent = "Đang gửi...";
      }
    } else {
      if (this.sendButton) {
        this.sendButton.textContent = "Gửi";
      }
      this.messageInput?.focus();
    }
  }

  saveMessages() {
    // Lưu tin nhắn vào chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({
        aiPanelMessages: this.messages.slice(-50), // Giữ 50 tin nhắn gần nhất
      });
    }
  }

  loadMessages() {
    // Tải tin nhắn từ chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["aiPanelMessages"], (result) => {
        if (result.aiPanelMessages && result.aiPanelMessages.length > 0) {
          this.messages = result.aiPanelMessages;
          this.renderMessages();
        }
      });
    }
  }

  renderMessages() {
    if (!this.messagesContainer) return;

    // Xóa tất cả tin nhắn hiện tại
    this.messagesContainer.innerHTML = "";

    if (this.messages.length === 0) {
      // Hiển thị welcome message nếu không có tin nhắn
      const welcomeDiv = document.createElement("div");
      welcomeDiv.className = "welcome-message";
      welcomeDiv.innerHTML =
        "Chào mừng đến với AIPanel!<br>Hãy bắt đầu trò chuyện với AI.";
      this.messagesContainer.appendChild(welcomeDiv);
    } else {
      // Hiển thị tất cả tin nhắn đã lưu
      this.messages.forEach((message: Message) => {
        this.addMessage(message.text, message.sender);
      });
    }
  }
}

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  new AIPanel();
});

// Xử lý phím tắt
document.addEventListener("keydown", (e: KeyboardEvent) => {
  // Ctrl + / để focus vào input
  if (e.ctrlKey && e.key === "/") {
    e.preventDefault();
    const input = document.getElementById(
      "messageInput"
    ) as HTMLTextAreaElement;
    if (input) input.focus();
  }
});
