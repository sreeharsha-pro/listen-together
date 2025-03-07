console.log("🎵 Music Sync: Background script loaded");

let ws: WebSocket | null = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 Received message from content script:", message);
  
    // Forward the message to WebSocket server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
});
  

function sendMessageToTabs(message: { event: string; currentTime?: number }) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message);
        }
      }
    });
  }

function connectWebSocket() {
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => console.log("✅ Connected to WebSocket server");

  ws.onerror = (error) => console.error("❌ WebSocket Error:", error);

  ws.onclose = () => {
    console.warn("⚠️ WebSocket Disconnected. Reconnecting in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onmessage = (event) => {
    console.log("📩 Received from WebSocket:", event.data);
    const message = JSON.parse(event.data);
    sendMessageToTabs(message);
  };
}

connectWebSocket();