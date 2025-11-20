

export function mergeTokenData(dexToken: any, jupiterToken: any) {
  if (!dexToken && !jupiterToken) return null;

  // Pick token address from whichever exists
  const tokenAddress =
    dexToken?.baseToken?.address ||
    dexToken?.baseToken?.symbol ||
    jupiterToken?.address ||
    null;

  return {
    token_address: tokenAddress,
    token_name: dexToken?.baseToken?.name || jupiterToken?.name || "Unknown",
    token_ticker: dexToken?.baseToken?.symbol || jupiterToken?.symbol || "N/A",

    // Use Dex price if available, else Jupiter price
    price_sol:
      dexToken?.priceSol ||
      jupiterToken?.price ||
      null,

    // Dex volume is usually more accurate
    volume_sol: dexToken?.volume?.h24 || null,

    // Dex market cap if present
    market_cap_sol: dexToken?.fdv || null,

    liquidity_sol: dexToken?.liquidity?.base || null,

    sources: {
      dex: dexToken || null,
      jupiter: jupiterToken || null
    }
  };
}
import redis, { cacheGet, cacheSet } from "../lib/cache";
import { searchTokens } from "./dexScreener";
import { searchJupiterTokens } from "./jupiter";

export async function getMergedToken(query: string) {
  const cacheKey = `merged:${query.toLowerCase()}`;

  // Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log("CACHE HIT:", query);
    return cached;
  }

  console.log("CACHE MISS:", query);

  // Fetch from APIs
  const dexResult = await searchTokens(query);
  const jupResult = await searchJupiterTokens(query);

  const dexToken = dexResult?.pairs?.[0] || null;
  const jupiterToken = jupResult?.tokens?.[0] || null;

  const merged = mergeTokenData(dexToken, jupiterToken);

  // Save to cache
  await cacheSet(cacheKey, merged, 30); // 30 second TTL

  return merged;
}

