import http from "../lib/http";

const BASE_URL = "https://lite-api.jup.ag/tokens/v2";

export async function searchJupiterTokens(query: string) {
  try {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
    const res = await http.get(url);

    return res.data; // Real Jupiter data
  } catch (err: any) {
    console.error("Jupiter API error:", err.message);
    return null;
  }
}
