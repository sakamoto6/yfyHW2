import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const boxSchema = {
  type: "OBJECT",
  properties: {
    brand: { type: "STRING" },
    name: { type: "STRING" },
    concentration: { type: "STRING" },
    sizeMl: { type: "NUMBER" },
    seasons: { type: "ARRAY", items: { type: "STRING", enum: ["Spring", "Summer", "Autumn", "Winter"] } },
    notes: {
      type: "OBJECT",
      properties: {
        top: { type: "ARRAY", items: { type: "STRING" } },
        mid: { type: "ARRAY", items: { type: "STRING" } },
        base: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["top", "mid", "base"],
    },
    confidence: { type: "INTEGER" },
  },
  required: ["brand", "name", "concentration", "sizeMl", "seasons", "notes", "confidence"],
};

const matchSchema = {
  type: "OBJECT",
  properties: {
    brand: { type: "STRING" },
    targetName: { type: "STRING" },
    concentration: { type: "STRING" },
    score: { type: "INTEGER" },
    dnaReason: { type: "STRING" },
    redundancyAlert: { type: "STRING" },
    gapAnalysis: { type: "STRING" },
    confidence: { type: "INTEGER" },
  },
  required: ["brand", "targetName", "concentration", "score", "dnaReason", "redundancyAlert", "gapAnalysis", "confidence"],
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!accessToken) return jsonResponse({ error: "請先登入再使用照片辨識。" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    return jsonResponse({ error: "辨識服務尚未完成設定，請管理員設定 Supabase 與 Gemini secrets。" }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) return jsonResponse({ error: "登入狀態已失效，請重新登入。" }, 401);

  let body: { imageBase64?: string; mimeType?: string; mode?: string; collection?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "請求內容不是有效的 JSON。" }, 400);
  }

  const { imageBase64, mimeType, mode } = body;
  if (typeof imageBase64 !== "string" || imageBase64.length > 5_600_000) {
    return jsonResponse({ error: "圖片內容空白或超過 4 MB。" }, 413);
  }
  if (!mimeType || !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return jsonResponse({ error: "僅支援 JPG、PNG 或 WebP 圖片。" }, 415);
  }
  if (mode !== "box" && mode !== "match") {
    return jsonResponse({ error: "不支援的辨識模式。" }, 400);
  }

  let imageBytes: Uint8Array;
  try {
    imageBytes = Uint8Array.from(atob(imageBase64), character => character.charCodeAt(0));
  } catch {
    return jsonResponse({ error: "圖片資料格式錯誤，請重新選取照片。" }, 400);
  }
  if (imageBytes.length > 4 * 1024 * 1024) {
    return jsonResponse({ error: "圖片超過 4 MB，請縮小圖片後再試。" }, 413);
  }

  const collection = Array.isArray(body.collection)
    ? body.collection.slice(0, 20).map((item) => {
      if (!item || typeof item !== "object") return null;
      const perfume = item as Record<string, unknown>;
      return {
        brand: String(perfume.brand || "").slice(0, 80),
        name: String(perfume.name || "").slice(0, 120),
        concentration: String(perfume.concentration || "").slice(0, 30),
        notes: perfume.notes,
      };
    }).filter(Boolean)
    : [];

  const prompt = mode === "box"
    ? `你是香水標籤辨識助手。根據圖片辨識瓶身或外盒上可讀的品牌、品名、濃度與容量；香調和適合季節只能在品牌品名足以可靠識別時依可靠知識補充，否則回傳空陣列。所有香調名稱一律使用繁體中文，例如 Pink Pepper 翻譯為「粉紅胡椒」、Neroli 為「橙花」、Clary Sage 為「快樂鼠尾草」、Java Vetiver 為「爪哇岩蘭草」、Tobacco Leaf 為「煙草葉」、Vanilla Bean 為「香草豆」、Styrax 為「蘇合香」；品牌與香水正式品名保留原文。不要猜測模糊文字：未知字串填空字串、未知容量填 0。季節只能使用 Spring、Summer、Autumn、Winter。信心度為 0 到 100 的整數。只輸出符合指定 JSON schema 的資料。`
    : `你是香水照片辨識與收藏比對助手。先辨識圖片可辨認的香水品牌、品名與濃度，再依提供的使用者典藏清單撰寫初步比對。所有香調名稱一律使用繁體中文，品牌與香水正式品名保留原文。你無法從照片聞到香味，請在理由中清楚說明這只是依香水公開香調資料的推估，不可宣稱實際嗅聞。 score 是 0 到 100 的整數；辨識不確定時降低信心度與契合分數。使用繁體中文。使用者典藏：${JSON.stringify(collection)}。只輸出符合指定 JSON schema 的資料。`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
    const geminiBody = JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: mode === "box" ? boxSchema : matchSchema,
      },
    });
    let geminiResponse: Response | null = null;
    let result: { error?: { status?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } = {};

    for (let attempt = 0; attempt < 2; attempt += 1) {
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: geminiBody,
        signal: AbortSignal.timeout(30000),
      });
      result = await geminiResponse.json();
      if (geminiResponse.ok) break;

      const status = String(result.error?.status || geminiResponse.status);
      const canRetry = ["UNAVAILABLE", "INTERNAL", "DEADLINE_EXCEEDED"].includes(status) ||
        [500, 502, 503, 504].includes(geminiResponse.status);
      if (!canRetry || attempt === 1) break;

      console.warn("Transient Gemini error; retrying once:", status);
      await new Promise(resolve => setTimeout(resolve, 700));
    }

    if (!geminiResponse) return jsonResponse({ error: "Gemini 連線失敗，請稍後再試。" }, 502);
    if (!geminiResponse.ok) {
      const upstreamStatus = String(result.error?.status || geminiResponse.status);
      console.error("Gemini request failed:", upstreamStatus);
      const message = upstreamStatus === "UNAUTHENTICATED" || upstreamStatus === "PERMISSION_DENIED"
        ? "Gemini API 金鑰無效，或此金鑰尚未啟用 Gemini API；請檢查 GEMINI_API_KEY Secret 與 Google AI Studio 專案設定。"
        : upstreamStatus === "RESOURCE_EXHAUSTED"
        ? "Gemini API 額度或速率限制已用盡，請檢查 Google AI Studio 的配額與計費設定。"
        : upstreamStatus === "NOT_FOUND"
        ? "Gemini 模型不存在或此 API 專案無權使用該模型。"
        : upstreamStatus === "INVALID_ARGUMENT"
        ? "Gemini 拒絕此圖片或辨識請求格式，請換一張圖片後重試。"
        : `AI 辨識服務暫時無法使用，已重試一次（${upstreamStatus}），請稍後再試。`;
      return jsonResponse({ error: message, upstreamStatus }, 502);
    }

    const text = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (!text) return jsonResponse({ error: "AI 沒有回傳可辨識的結果，請換一張清晰照片。" }, 422);
    const parsed = JSON.parse(text);
    const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0)));

    if (mode === "box") {
      return jsonResponse({
        confidence,
        boxData: {
          brand: String(parsed.brand || ""),
          name: String(parsed.name || ""),
          concentration: String(parsed.concentration || ""),
          sizeMl: Math.max(0, Math.round(Number(parsed.sizeMl) || 0)),
          remainingMl: Math.max(0, Math.round(Number(parsed.sizeMl) || 0)),
          rating: 0,
          seasons: Array.isArray(parsed.seasons) ? parsed.seasons.filter((season: string) => ["Spring", "Summer", "Autumn", "Winter"].includes(season)) : [],
          notes: {
            top: Array.isArray(parsed.notes?.top) ? parsed.notes.top.map(String).slice(0, 8) : [],
            mid: Array.isArray(parsed.notes?.mid) ? parsed.notes.mid.map(String).slice(0, 8) : [],
            base: Array.isArray(parsed.notes?.base) ? parsed.notes.base.map(String).slice(0, 8) : [],
          },
        },
      });
    }

    return jsonResponse({
      confidence,
      matchData: {
        brand: String(parsed.brand || ""),
        targetName: String(parsed.targetName || ""),
        concentration: String(parsed.concentration || ""),
        score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
        dnaReason: String(parsed.dnaReason || ""),
        redundancyAlert: String(parsed.redundancyAlert || ""),
        gapAnalysis: String(parsed.gapAnalysis || ""),
      },
    });
  } catch (error) {
    console.error("Perfume analysis failed:", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse({ error: "照片辨識失敗，請檢查網路後重試。" }, 502);
  }
});