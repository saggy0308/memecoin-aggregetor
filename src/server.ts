import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";
import { setIO } from "./lib/socket";
import { startPoller } from "./workers/poller";
import "./lib/cache"; // ensure redis connects

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

  socket.emit("welcome", { message: "Hello from WebSocket server!" });
  // Optionally allow client to subscribe to filters; left as exercise
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Start background poller only after server is listening
  startPoller();
});
