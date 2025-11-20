// src/services/aggregator.ts
import { cacheGet, cacheSet } from "../lib/cache";
import { searchTokens } from "./dexScreener";
import { searchJupiterTokens } from "./jupiter";

// Merges DexScreener and Jupiter token data
export function mergeTokenData(dexToken: any, jupiterToken: any) {
  if (!dexToken && !jupiterToken) return null;

  const tokenAddress =
    dexToken?.baseToken?.address ||
    jupiterToken?.address ||
    null;

  return {
    token_address: tokenAddress,
    token_name: dexToken?.baseToken?.name || jupiterToken?.name || "Unknown",
    token_ticker: dexToken?.baseToken?.symbol || jupiterToken?.symbol || "N/A",

    price_sol:
      dexToken?.priceSol ||
      jupiterToken?.price ||
      null,

    volume_sol: dexToken?.volume?.h24 || null,

    market_cap_sol: dexToken?.fdv || null,

    liquidity_sol: dexToken?.liquidity?.base || null,

    sources: {
      dex: dexToken || null,
      jupiter: jupiterToken || null
    }
  };
}

// MAIN FUNCTION you are looking for
export async function getMergedToken(query: string) {
  const cacheKey = `merged:${query.toLowerCase()}`;

  // 1. Try cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    console.log("CACHE HIT:", query);
    return cached;
  }

  console.log("CACHE MISS:", query);

  // 2. Fetch from DEX APIs
  const dexResult = await searchTokens(query);
  const jupResult = await searchJupiterTokens(query);

  const dexToken = dexResult?.pairs?.[0] || null;
  const jupiterToken = jupResult?.tokens?.[0] || null;

  // 3. Merge both sources
  const merged = mergeTokenData(dexToken, jupiterToken);

  // 4. Save merged data to Redis (TTL = 30s)
  await cacheSet(cacheKey, merged, 30);

  return merged;
}
