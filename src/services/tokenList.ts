import { cacheGet } from "../lib/cache";
import { mergeTokenData } from "./aggregator";

export async function getAllMergedTokens(queries: string[]) {
  const results: any[] = [];

  for (const q of queries) {
    const key = `merged:${q.toLowerCase()}`;
    const data = await cacheGet(key);
    if (data) results.push(data);
  }

  return results;
}
export function filterTokens(tokens: any[], q?: string, timePeriod?: string) {
    let filtered = tokens;
  
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(t =>
        t.token_name?.toLowerCase().includes(query) ||
        t.token_ticker?.toLowerCase().includes(query)
      );
    }
  
    // timePeriod reserved for future use (1h, 24h, 7d)
    // currently DexScreener API returns only 1h & 24h % changes
    // you can expand later
    if (timePeriod === "1h") {
      filtered = filtered.filter(t => t.price_1hr_change !== undefined);
    }
  
    return filtered;
  }
  export function sortTokens(tokens: any[], sort: string = "volume_desc") {
    const sorted = [...tokens];
  
    switch (sort) {
      case "volume_desc":
        sorted.sort((a, b) => b.volume_sol - a.volume_sol);
        break;
      case "price_change_desc":
        sorted.sort((a, b) => b.price_1hr_change - a.price_1hr_change);
        break;
      case "market_cap_desc":
        sorted.sort((a, b) => b.market_cap_sol - a.market_cap_sol);
        break;
      case "liquidity_desc":
        sorted.sort((a, b) => b.liquidity_sol - a.liquidity_sol);
        break;
      default:
        break;
    }
  
    return sorted;
  }
  export function paginateTokens(tokens: any[], limit = 20, cursor?: string) {
    let startIndex = 0;
  
    if (cursor) {
      const decoded = JSON.parse(Buffer.from(cursor, "base64").toString());
      startIndex = decoded.index;
    }
  
    const page = tokens.slice(startIndex, startIndex + limit);
  
    let nextCursor = null;
  
    if (startIndex + limit < tokens.length) {
      nextCursor = Buffer.from(JSON.stringify({ index: startIndex + limit })).toString("base64");
    }
  
    return { page, nextCursor };
  }
      