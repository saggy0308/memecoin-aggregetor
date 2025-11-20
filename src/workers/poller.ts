// src/workers/poller.ts
import cron from "node-cron";
import { getMergedToken } from "../services/aggregator";
import { cacheGet, cacheSet } from "../lib/cache";
import { emitBulkUpdates } from "../lib/socket";
import { getAllClientFilters, getIO } from "../lib/socket";

// Queries to poll
export const POLL_QUERIES = [
  "solana",
  "bonk",
  "dogwifhat"
];

const POLL_INTERVAL_CRON = "*/10 * * * * *"; // every 10 seconds

function isSignificantChange(oldObj: any, newObj: any) {
  if (!oldObj || !newObj) return true;

  const oldPrice = Number(oldObj.price_sol ?? 0);
  const newPrice = Number(newObj.price_sol ?? 0);

  const oldVol = Number(oldObj.volume_sol ?? 0);
  const newVol = Number(newObj.volume_sol ?? 0);

  if (oldPrice !== newPrice) return true;

  if (oldVol == 0 && newVol > 0) return true;
  if (oldVol > 0 && newVol / oldVol > 1.5) return true;

  return false;
}

export function startPoller() {
  console.log("Starting poller (every 10s) for queries:", POLL_QUERIES);

  // Run immediately on server start
  POLL_QUERIES.forEach((q) => pollAndEmit(q));

  // Schedule cron job
  cron.schedule(POLL_INTERVAL_CRON, async () => {
    try {
      const updates: any[] = [];

      for (const q of POLL_QUERIES) {
        const update = await pollAndEmit(q);
        if (update) updates.push(update);
      }

      if (updates.length > 0) {
        emitBulkUpdates(updates);
      }
    } catch (err) {
      console.error("Poller error:", err);
    }
  });
}

async function pollAndEmit(query: string) {
  console.log("POLL START for:", query);

  try {
    const cacheKey = `merged:${query.toLowerCase()}`;

    const merged = await getMergedToken(query);
    if (!merged) return null;

    const prev = await cacheGet(cacheKey);

    const significant = isSignificantChange(prev, merged);

    if (significant) {
      const diff: any = {
        token_address: merged.token_address,
        timestamp: Date.now(),
        price_sol: merged.price_sol,
        volume_sol: merged.volume_sol,
        market_cap_sol: merged.market_cap_sol,
        liquidity_sol: merged.liquidity_sol,
        token_name: merged.token_name,
        token_ticker: merged.token_ticker,
      };

      console.log("\n--- POLLER DEBUG ---");
      console.log("Query:", query);
      console.log("Prev:", prev);
      console.log("Merged:", merged);
      console.log("Significant change?", significant);
      console.log("EMITTING UPDATE:", diff);

      const io = getIO();
      const clients = getAllClientFilters();

      clients.forEach((filter, socketId) => {
        const q = (filter.q || "").toLowerCase();

        const name = (merged.token_name || "").toLowerCase();
        const ticker = (merged.token_ticker || "").toLowerCase();

        if (q === "" || name.includes(q) || ticker.includes(q)) {
          io.to(socketId).emit("token_update", diff);
        }
      });

      await cacheSet(cacheKey, merged, 30);
      return diff;
    } else {
      await cacheSet(cacheKey, merged, 30);
      return null;
    }

  } catch (err) {
    console.error(`pollAndEmit error for ${query}:`, err);
    return null;
  }
}
