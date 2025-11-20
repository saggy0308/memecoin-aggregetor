import { Router } from "express";
import { getAllMergedTokens, filterTokens, sortTokens, paginateTokens } from "../services/tokenList";
import { POLL_QUERIES } from "../workers/poller";

const router = Router();

router.get("/", async (req, res) => {
  const { q, sort = "volume_desc", limit = 20, cursor, timePeriod } = req.query;

  // 1. Load merged cached tokens
  const tokens = await getAllMergedTokens(POLL_QUERIES);

  // 2. Apply filtering
  const filtered = filterTokens(tokens, q as string, timePeriod as string);

  // 3. Apply sorting
  const sorted = sortTokens(filtered, sort as string);

  // 4. Apply pagination
  const { page, nextCursor } = paginateTokens(sorted, Number(limit), cursor as string);

  res.json({
    data: page,
    nextCursor
  });
});

export default router;
