/**
 * Cloudflare Worker 中介層
 *
 * 用途:
 *  1. 代理呼叫 Anthropic API,ANTHROPIC_API_KEY 只存在這裡的環境變數(wrangler secret),
 *     絕不出現在前端程式碼中。
 *  2. 記錄每日/每月 token 用量與估算花費(存在 Workers KV),供前端預算視覺化使用。
 *  3. 三層預算門檻(USD 10 / 20 / 30),見 docs/requirements.md 3.9 節。
 *  4. 存取控管:要求每個請求帶上呼叫者的 Google OAuth access token,Worker 會向 Google
 *     驗證這個 token 屬於 ALLOWED_EMAIL 這個帳號,才放行。
 *
 *     這一條不是需求文件明文寫的,是額外補上的安全措施:前端是完全公開的靜態網站,
 *     任何人在瀏覽器「檢視原始碼」都能看到這個 Worker 的網址。如果 Worker 本身不做任何
 *     存取控管,等於是一個誰都能呼叫的公開 AI 代理,即使 API 金鑰本身安全,別人還是能
 *     用你的 Worker 把你當月 USD 30 預算燒光。既然整個系統本來就靠 Google 登入把關資料
 *     存取(見需求文件 4.3 節),讓 AI 呼叫也用同一個 Google 帳號驗證是最一致的做法。
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// 定價為每百萬 token 的美元價格(依 docs/requirements.md 4.4 節,2026年7月官方定價)
const SONNET_PROMO_END = new Date("2026-09-01T00:00:00Z");
function getPricing(model, now) {
  if (model === "claude-sonnet-5") {
    return now < SONNET_PROMO_END ? { input: 2, output: 10 } : { input: 3, output: 15 };
  }
  if (model === "claude-haiku-4-5-20251001") {
    return { input: 1, output: 5 };
  }
  // 未知模型一律用較貴的 Sonnet 標準價估算,避免低估花費
  return { input: 3, output: 15 };
}

const BUDGET_TIERS = { warn: 10, alert: 20, hardStop: 30 };

function corsHeaders(origin, allowedOrigin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
  if (origin === allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  return headers;
}

function json(data, status, origin, allowedOrigin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin, allowedOrigin)
    }
  });
}

function monthKey(date) {
  return date.toISOString().slice(0, 7); // "2026-07"
}
function dayKey(date) {
  return date.toISOString().slice(0, 10); // "2026-07-10"
}

async function verifyGoogleAccessToken(accessToken, env) {
  if (!accessToken) return false;
  try {
    // 用 tokeninfo 端點(而非 userinfo),因為它會回傳 token 的 audience(aud):
    // 也就是「這個 token 是發給哪個 OAuth 應用的」。只驗證 email 不夠——使用者授權過的
    // 任何第三方 Google 應用拿到的 token 也屬於同一個 email,若不比對 aud,那些 token
    // 也能通過驗證來盜用本 Worker 的 AI 預算(confused deputy)。這裡要求 aud 必須等於
    // 我們自己的 OAuth Client ID,確保 token 是本工具的前端簽發的。
    const resp = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?access_token=" + encodeURIComponent(accessToken)
    );
    if (!resp.ok) return false;
    const info = await resp.json();
    const emailOk = info.email === env.ALLOWED_EMAIL && (info.email_verified === true || info.email_verified === "true");
    // Google 對 access token 的 tokeninfo,client ID 可能出現在 aud 或 azp,兩者接受其一即可
    const audOk = !env.GOOGLE_CLIENT_ID || info.aud === env.GOOGLE_CLIENT_ID || info.azp === env.GOOGLE_CLIENT_ID;
    return emailOk && audOk;
  } catch (e) {
    return false;
  }
}

async function loadMonthUsage(kv, key) {
  const raw = await kv.get(key);
  if (raw) return JSON.parse(raw);
  return { totalCost: 0, byModel: {}, byDay: {}, override: false };
}

async function saveMonthUsage(kv, key, usage) {
  await kv.put(key, JSON.stringify(usage));
}

function recordUsage(usage, model, inputTokens, outputTokens, cost, day) {
  usage.totalCost += cost;
  if (!usage.byModel[model]) usage.byModel[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
  usage.byModel[model].inputTokens += inputTokens;
  usage.byModel[model].outputTokens += outputTokens;
  usage.byModel[model].cost += cost;

  if (!usage.byDay[day]) usage.byDay[day] = { cost: 0, byModel: {} };
  usage.byDay[day].cost += cost;
  if (!usage.byDay[day].byModel[model]) usage.byDay[day].byModel[model] = { cost: 0, inputTokens: 0, outputTokens: 0 };
  usage.byDay[day].byModel[model].cost += cost;
  usage.byDay[day].byModel[model].inputTokens += inputTokens;
  usage.byDay[day].byModel[model].outputTokens += outputTokens;
}

function budgetTier(totalCost) {
  if (totalCost >= BUDGET_TIERS.hardStop) return "hardStop";
  if (totalCost >= BUDGET_TIERS.alert) return "alert";
  if (totalCost >= BUDGET_TIERS.warn) return "warn";
  return "ok";
}

async function handleMessages(request, env, origin) {
  const now = new Date();
  const mKey = monthKey(now);
  const dKey = dayKey(now);

  const usage = await loadMonthUsage(env.USAGE_KV, mKey);
  const tier = budgetTier(usage.totalCost);

  if (tier === "hardStop" && !usage.override) {
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return json(
      {
        error: "budget_exceeded",
        message: `本月 AI 預算已達上限(USD ${BUDGET_TIERS.hardStop}),將於 ${nextMonth.toISOString().slice(0, 10)} 重置。如需應急使用,請在前端確認後呼叫 /budget/override。`,
        totalCost: usage.totalCost
      },
      402,
      origin,
      env.ALLOWED_ORIGIN
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "invalid_json" }, 400, origin, env.ALLOWED_ORIGIN);
  }
  if (!body.model || !body.messages) {
    return json({ error: "missing_model_or_messages" }, 400, origin, env.ALLOWED_ORIGIN);
  }
  // 拒絕串流回應:串流是 SSE 格式,下面用 resp.json() 會解析失敗而略過用量記錄,
  // 但 Anthropic 仍照常計費,等於繞過 USD 30 硬上限。本工具的功能都不需要串流,直接擋掉。
  if (body.stream) {
    return json({ error: "stream_not_supported", message: "本中介層不支援串流回應。" }, 400, origin, env.ALLOWED_ORIGIN);
  }

  const anthropicResp = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION
    },
    body: JSON.stringify(body)
  });

  const respData = await anthropicResp.json();

  if (anthropicResp.ok && respData.usage) {
    const pricing = getPricing(body.model, now);
    const inputTokens = respData.usage.input_tokens || 0;
    const outputTokens = respData.usage.output_tokens || 0;
    const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
    recordUsage(usage, body.model, inputTokens, outputTokens, cost, dKey);
    await saveMonthUsage(env.USAGE_KV, mKey, usage);
  }

  return json(
    {
      ...respData,
      _budget: { totalCost: usage.totalCost, tier: budgetTier(usage.totalCost) }
    },
    anthropicResp.status,
    origin,
    env.ALLOWED_ORIGIN
  );
}

async function handleBudgetStatus(request, env, origin) {
  const now = new Date();
  const mKey = monthKey(now);
  const usage = await loadMonthUsage(env.USAGE_KV, mKey);
  return json(
    {
      month: mKey,
      totalCost: usage.totalCost,
      tier: budgetTier(usage.totalCost),
      tiers: BUDGET_TIERS,
      byModel: usage.byModel,
      byDay: usage.byDay,
      override: !!usage.override
    },
    200,
    origin,
    env.ALLOWED_ORIGIN
  );
}

async function handleBudgetOverride(request, env, origin) {
  const now = new Date();
  const mKey = monthKey(now);
  const usage = await loadMonthUsage(env.USAGE_KV, mKey);
  usage.override = true;
  await saveMonthUsage(env.USAGE_KV, mKey, usage);
  return json({ ok: true, message: "本月預算硬上限已手動解除,請留意實際花費。" }, 200, origin, env.ALLOWED_ORIGIN);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env.ALLOWED_ORIGIN) });
    }

    if (origin !== env.ALLOWED_ORIGIN) {
      return json({ error: "origin_not_allowed" }, 403, origin, env.ALLOWED_ORIGIN);
    }

    const authHeader = request.headers.get("Authorization") || "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    const authorized = await verifyGoogleAccessToken(accessToken, env);
    if (!authorized) {
      return json({ error: "unauthorized", message: "請先用授權的 Google 帳號登入。" }, 401, origin, env.ALLOWED_ORIGIN);
    }

    if (url.pathname === "/v1/messages" && request.method === "POST") {
      return handleMessages(request, env, origin);
    }
    if (url.pathname === "/budget/status" && request.method === "GET") {
      return handleBudgetStatus(request, env, origin);
    }
    if (url.pathname === "/budget/override" && request.method === "POST") {
      return handleBudgetOverride(request, env, origin);
    }

    return json({ error: "not_found" }, 404, origin, env.ALLOWED_ORIGIN);
  }
};
