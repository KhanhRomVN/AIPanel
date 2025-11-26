// Chrome Extension Service Worker for AIPanel

// --- Side Panel functionality ---
chrome.sidePanel
 .setPanelBehavior({ openPanelOnActionClick: true })
 .catch((error) => console.error("Failed to set panel behavior:", error));

// --- Message handling ---
chrome.runtime.onMessage.addListener(
 (
 request,
 _sender,
 sendResponse
 ) => {
 // Handle AI chat messages
 if (request.action === "sendAIMessage") {
 // Tạm thời xử lý mock response
 // Trong tương lai có thể tích hợp với API AI thực tế
 setTimeout(() => {
 const responses = [
 "Xin chào! Tôi là AI assistant. Tôi có thể giúp gì cho bạn?",
 "Tôi hiểu câu hỏi của bạn. Bạn có thể cung cấp thêm thông tin không?",
 "Đây là một câu hỏi thú vị. Tôi sẽ cố gắng hỗ trợ bạn tốt nhất có thể.",
 "Cảm ơn bạn đã chia sẻ. Tôi đang xử lý thông tin này...",
 "Tôi có thể giúp bạn với nhiều chủ đề khác nhau. Hãy cho tôi biết bạn cần hỗ trợ gì!",
 ];
 const randomResponse =
 responses[Math.floor(Math.random() * responses.length)];
 sendResponse({ success: true, response: randomResponse });
 }, Math.random() * 1000 + 500);
 return true; // Keep message channel open for async response
 }

 // Handle storage operations
 if (request.action === "saveChatMessages") {
 chrome.storage.local.set({ aiPanelMessages: request.messages }, () => {
 sendResponse({ success: true });
 });
 return true;
 }

 if (request.action === "loadChatMessages") {
 chrome.storage.local.get(["aiPanelMessages"], (result) => {
 sendResponse({ success: true, messages: result.aiPanelMessages || [] });
 });
 return true;
 }

 // Keep the message channel open for all cases to avoid port closed errors
 return true;
 }
);

// Initialize on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
 console.log("AIPanel extension installed");
});

chrome.runtime.onStartup.addListener(() => {
 console.log("AIPanel extension started");
});

// Handle extension errors
self.addEventListener("error", (event) => {
 console.error("AIPanel service worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
 console.error("AIPanel service worker unhandled rejection:", event.reason);
});
