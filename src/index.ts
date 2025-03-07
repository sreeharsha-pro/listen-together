import { WebSocketServer, WebSocket  } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.on("message", (data:  string) => {
    console.log("Received:", data.toString());

    // Broadcast the message to all clients
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));
});

console.log("WebSocket server running on ws://localhost:8080");
