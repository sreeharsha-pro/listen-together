import { WebSocketServer, WebSocket  } from "ws";

import dotenv from "dotenv";

dotenv.config();

const wss = new WebSocketServer({ port: Number(process.env.PORT) });

wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.on("message", (data: string) => {
    
    const message = data.toString();
    console.log("Received message from browser:", message);

    // Broadcast the message to all clients
    // each browser is a single client not tabs are diff clients
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
        console.log("Broadcasting message to other browsers: ", message)
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));
});

console.log(`WebSocket server running on ws://localhost:${process.env.PORT}`);
