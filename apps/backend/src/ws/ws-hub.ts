import type { ServerMessage } from "@nova-strike/shared";
import { WebSocketServer, WebSocket } from "ws";
export class WsHub {
  private readonly server: WebSocketServer;
  constructor(options: { port: number; host: string }) { this.server = new WebSocketServer(options); }
  onConnection(handler: (socket: WebSocket) => void) { this.server.on("connection", handler); }
  send(socket: WebSocket, message: ServerMessage) { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); }
  broadcast(message: ServerMessage) { const data = JSON.stringify(message); for (const client of this.server.clients) if (client.readyState === WebSocket.OPEN) client.send(data); }
  close() { this.server.close(); }
}
