// src/workers/poller.ts
import cron from "node-cron";
import { getMergedToken } from "../services/aggregator";
import { cacheGet, cacheSet } from "../lib/cache";
import { emitTokenUpdate, emitBulkUpdates } from "../lib/socket";

/**
 * POLL LIST: adjust this list to the queries or token identifiers you want
 * For a minimal test we poll a few sample queries. Later you'd store tokens of interest.
 */
const POLL_QUERIES = [
  "solana",
  "mina",      // example additional queries
  "memecoin"   // replace with real queries / token addresses you care about
];

const POLL_INTERVAL_CRON = "*/10 * * * * *"; // every 10 seconds

function isSignificantChange(oldObj: any, newObj: any) {
  if (!oldObj || !newObj) return true;
  // detect price change or volume change — adjust thresholds as desired
  const oldPrice = Number(oldObj.price_sol ?? 0);
  const newPrice = Number(newObj.price_sol ?? 0);
  const oldVol = Number(oldObj.volume_sol ?? 0);
  const newVol = Number(newObj.volume_sol ?? 0);

  if (oldPrice !== newPrice) return true;
  // consider volume spike if > 50% increase
  if (oldVol === 0 && newVol > 0) return true;
  if (oldVol > 0 && newVol / oldVol > 1.5) return true;

  return false;
}

export function startPoller() {
  console.log("Starting poller (every 10s) for queries:", POLL_QUERIES);

  // run immediately once
  POLL_QUERIES.forEach((q) => pollAndEmit(q));

  // schedule cron
  cron.schedule(POLL_INTERVAL_CRON, async () => {
    try {
      const updates: any[] = [];
      for (const q of POLL_QUERIES) {
        const update = await pollAndEmit(q);
        if (update) updates.push(update);
      }
      if (updates.length > 0) {
        // Emit batch update to reduce chattiness
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

    // fetch merged (this will use cache-aside and call APIs if missing)
    const merged = await getMergedToken(query);
    if (!merged) return null;

    // compare with previous cached merged (the raw cached copy, before this poll)
    const prev = await cacheGet(cacheKey);

    if (isSignificantChange(prev, merged)) {
      // create a small diff payload - only changed fields
      const diff: any = { token_address: merged.token_address, timestamp: Date.now() };

    //   if (!prev || prev.price_sol !== merged.price_sol) diff.price_sol = merged.price_sol;
    //   if (!prev || prev.volume_sol !== merged.volume_sol) diff.volume_sol = merged.volume_sol;
    //   if (!prev || prev.market_cap_sol !== merged.market_cap_sol) diff.market_cap_sol = merged.market_cap_sol;
    //   if (!prev || prev.liquidity_sol !== merged.liquidity_sol) diff.liquidity_sol = merged.liquidity_sol;
    //   if (!prev || prev.token_name !== merged.token_name) diff.token_name = merged.token_name;
        console.log("\n--- POLLER DEBUG ---");
        console.log("Query:", query);
        console.log("Prev:", prev);
        console.log("Merged:", merged);
        console.log("Significant change?", isSignificantChange(prev, merged));

      // Save merged to cache (refresh TTL)
      await cacheSet(cacheKey, merged, 30);
      console.log("EMITTING UPDATE:", diff);

      // Emit single update
      emitTokenUpdate(diff);

      // Also return update for bulk emission
      return diff;
    } else {
      // refresh TTL only (no emit)
      await cacheSet(cacheKey, merged, 30);
      return null;
    }
  } catch (err) {
    console.error(`pollAndEmit error for ${query}:`, err);
    return null;
  }
}
