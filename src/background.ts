console.log("🎵 Music Sync: Background script loaded");

let ws: WebSocket | null = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 Received message from content script:", message);
  
  // Forward the message to WebSocket server
  console.log(ws,ws?.readyState, WebSocket.OPEN)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
});
  
function sendMessageToTabs(message: { event: string; currentTime?: number }) {
    console.log("send message to tabs function called")
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message);
          console.log("Forwarding message to content script in tab: ", tab.id)
        }
      }
    });
  }

function connectWebSocket() {
  ws = new WebSocket(`ws://localhost:${process.env.PORT}`);

  ws.onopen = () => console.log("✅ Connected to WebSocket server");

  ws.onerror = (error) => console.error("❌ WebSocket Error:", JSON.stringify(error));

  ws.onclose = () => {
    console.warn("⚠️ WebSocket Disconnected. Reconnecting in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onmessage = (event) => {
    console.log("📩 Background script onmessage received from WebSocket:", event.data);
    const message = JSON.parse(event.data);
    console.log(message)
    sendMessageToTabs(message);
  };
}

connectWebSocket();