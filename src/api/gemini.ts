import { OfferItem } from "../types";

export const SSC_API_BASE_URL = "https://ssc.jrina.online";

/**
 * AI Shopper Assistant powered by server-side Gemini proxy with offline proximity fallback.
 * Strictly avoids exposing Google API keys in mobile client binaries.
 */
export async function askShopperAI(
  query: string,
  nearbyOffers: OfferItem[] = []
): Promise<string> {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) {
    return 'ഹലോ! അടുത്തുള്ള ഓഫറുകളും കിഴിവുകളും അറിയാൻ എന്നോട് ചോദിക്കൂ (e.g., "ഏറ്റവും നല്ല ബിരിയാണി ഓഫർ എവിടെയുണ്ട്?" or "Electronics deals near me").';
  }

  // 1. Query secure server-side proxy with 8s timeout safeguard
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${SSC_API_BASE_URL}/api/gemini/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: cleanQuery,
        nearbyOffers: nearbyOffers.slice(0, 8).map((o) => ({
          storeName: o.storeName,
          category: o.category,
          address: o.address,
          discountTag: o.discountTag,
          originalPrice: o.originalPrice,
          offerPrice: o.offerPrice,
          expiresAt: o.expiresAt,
          description: o.description
        }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.answer && typeof data.answer === "string") {
        return data.answer.trim();
      }
    }
  } catch (err) {
    console.warn("[Shopper AI] Server proxy request failed or timed out, using smart fallback:", err);
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. Smart Proximity Fallback Matcher (Offline / Network issue safeguard)
  const lower = cleanQuery.toLowerCase();
  const matched = nearbyOffers.find(
    (o) =>
      o.category.toLowerCase().includes(lower) ||
      o.storeName.toLowerCase().includes(lower) ||
      o.discountTag.toLowerCase().includes(lower) ||
      o.description.toLowerCase().includes(lower)
  ) || nearbyOffers[0];

  if (matched) {
    return `അടുത്തുള്ള മികച്ച ഓഫർ: **${matched.storeName}**-ൽ **${matched.discountTag}** ലഭ്യമാണ്! വില ${matched.offerPrice} (${matched.originalPrice}-ന് പകരം). സ്ഥലം: ${matched.address}.`;
  }

  return `നിങ്ങളുടെ അടുത്ത് ഇപ്പോൾ ${nearbyOffers.length} ലൈവ് ഓഫറുകൾ സജീവമാണ്! മാപ്പിലോ ഡീൽസ് ടാബിലോ നോക്കൂ.`;
}
