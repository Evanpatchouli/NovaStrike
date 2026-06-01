import type { ServerMessage } from "@nova-strike/shared";
export function connectNovaStrikeWs(input: { onOpen: () => void; onClose: () => void; onMessage: (message: ServerMessage) => void }) {
  let closedByUser = false; let socket: WebSocket | undefined;
  const connect = () => { socket = new WebSocket("ws://127.0.0.1:3001"); socket.addEventListener("open", input.onOpen); socket.addEventListener("close", () => { input.onClose(); if (!closedByUser) window.setTimeout(connect, 1000); }); socket.addEventListener("message", (event) => { try { input.onMessage(JSON.parse(event.data) as ServerMessage); } catch (error) { console.error("Invalid NovaStrike WS message", error); } }); };
  connect(); return () => { closedByUser = true; socket?.close(); };
}
