// src/lib/socket.ts
import { Server as IOServer, Socket } from "socket.io";

let io: IOServer | null = null;

export function setIO(server: IOServer) {
  io = server;
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.IO not initialized. Call setIO(io) first.");
  return io;
}

// helper to emit token updates
export function emitTokenUpdate(payload: any) {
  if (!io) return;
  // emit to a general room/namespace; frontend can filter
  io.emit("token_update", payload);
}

// batch emit
export function emitBulkUpdates(payloads: any[]) {
  if (!io) return;
  io.emit("bulk_update", payloads);
}
