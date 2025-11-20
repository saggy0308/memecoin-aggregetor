import { Router } from "express";
import { getMergedToken } from "../services/aggregator";

const router = Router();

router.get("/", async (req, res) => {
  const query = String(req.query.q || "solana");

  const merged = await getMergedToken(query);

  res.json({ merged });
});

export default router;
