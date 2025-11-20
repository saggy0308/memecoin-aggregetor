import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";

import { startPoller } from "./workers/poller";
import "./lib/cache"; // ensure redis connects
import { setIO, setClientFilter, removeClientFilter } from "./lib/socket";

const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);

// Initialize WebSocket
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

setIO(io);

// Basic WS handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Default subscription (all tokens)
  setClientFilter(socket.id, { q: "", sort: "volume_desc" });

  socket.emit("welcome", { message: "Hello from WebSocket server!" });

  // Listen for subscription changes from client
  socket.on("subscribe", (filters) => {
    console.log("Client subscribed:", socket.id, filters);
    setClientFilter(socket.id, filters);
  });

  socket.on("disconnect", () => {
    removeClientFilter(socket.id);
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Start background poller only after server is listening
  startPoller();
});
