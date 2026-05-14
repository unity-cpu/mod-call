const callLog = new Map();
const banned = new Set();

const LIMIT = 3;
const WINDOW = 60_000;

async function playfabBan(playerId) {
  const titleId = process.env.PLAYFAB_TITLE_ID;
  const secret = process.env.PLAYFAB_SECRET_KEY;
  if (!titleId || !secret) return false;

  const r = await fetch(`https://${titleId}.playfabapi.com/Admin/BanUsers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-SecretKey": secret },
    body: JSON.stringify({
      Bans: [{ PlayFabId: playerId, Reason: "spamming mod calls" }],
      // DurationInHours: 24
    }),
  });

  const json = await r.json();
  return r.ok && json.status === "OK";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const secret = process.env.MODERATOR_SECRET;
  if (secret && req.headers["x-moderator-secret"] !== secret)
    return res.status(401).json({ error: "unauthorized" });

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  const spamWebhook = process.env.DISCORD_SPAM_WEBHOOK_URL;
  if (!webhook || !spamWebhook)
    return res.status(500).json({ error: "webhooks not configured" });

  const { roomName, callerName, playerId } = req.body;
  if (!roomName || !callerName || !playerId)
    return res.status(400).json({ error: "missing fields" });

  if (banned.has(playerId))
    return res.status(403).json({ error: "you are banned" });

  const now = Date.now();
  const entry = callLog.get(playerId) ?? { count: 0, since: now };
  if (now - entry.since > WINDOW) { entry.count = 0; entry.since = now; }
  entry.count++;
  callLog.set(playerId, entry);

  if (entry.count > LIMIT) {
    banned.add(playerId);
    callLog.delete(playerId);

    const ok = await playfabBan(playerId);

    await fetch(spamWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `# **PLAYER BANNED**\n- *Player: ${callerName}*\n- *ID: \`${playerId}\`*\n- *Room: ${roomName}*\n- *PlayFab: ${ok ? "✅ banned" : "❌ failed to ban :("}*\n\n-# made by unity.lolz`,
      }),
    });

    return res.status(429).json({ error: "banned for spamming" });
  }

  const r = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `# **MOD CALLED**\n- *Room: ${roomName}*\n- *Caller: ${callerName}*\n- *ID: \`${playerId}\`**\n\n-# made by unity.lolz`,
    }),
  });

  if (!r.ok) return res.status(502).json({ error: "discord request failed" });
  return res.status(200).json({ success: true });
}
