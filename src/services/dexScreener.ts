import http from "../lib/http";

const BASE_URL = "https://api.dexscreener.com/latest/dex";

export async function searchTokens(query: string) {
  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
    // const url = `${BASE_URL}/search_broken?q=${encodeURIComponent(query)}`;

    const res = await http.get(url);

    return res.data;
  } catch (err: any) {
    console.error("DexScreener error:", err.message);
    return null;
  }
}
