import express from "express";
import cors from "cors";
import discoverRoute from "./routes/discover";
import path from "path";
const app = express();
app.use(cors());
app.use(express.json());

// Temporary route to verify API works
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/discover", discoverRoute);
app.use(express.static(path.join(__dirname, "../public")));
export default app;
