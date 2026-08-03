const LIMIT = 1;
const WINDOW = 60;

async function redis(command, args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const r = await fetch(`${url}/${[command, ...args].join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await r.json();
  return json.result;
}

async function playfabBan(playerId) {
  const titleId = process.env.PLAYFAB_TITLE_ID;
  const secret = process.env.PLAYFAB_SECRET_KEY;
  if (!titleId || !secret) return false;

  const r = await fetch(`https://${titleId}.playfabapi.com/Admin/BanUsers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-SecretKey": secret },
    body: JSON.stringify({
      Bans: [{ PlayFabId: playerId, Reason: "spamming mod calls", DurationInHours: 24 }],
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

  // check if banned
  const isBanned = await redis("get", [`banned:${playerId}`]);
  if (isBanned) return res.status(403).json({ error: "you are banned" });

  // increment call count
  const count = await redis("incr", [`calls:${playerId}`]);
  if (count === 1) await redis("expire", [`calls:${playerId}`, WINDOW]);

  if (count > LIMIT) {
    await redis("set", [`banned:${playerId}`, 1, "ex", 86400]);
    await redis("del", [`calls:${playerId}`]);

    const ok = await playfabBan(playerId);

    await fetch(spamWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: [
          `# **PLAYER BANNED**`,
          `- *Player: ${callerName}*`,
          `- *ID: \`${playerId}\`*`,
          `- *Room: ${roomName}*`,
          ``,
          `-# made by unity.lolz`,
        ].join("\n"),
      }),
    });

    return res.status(429).json({ error: "banned for spamming" });
  }

  const r = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: [
        `# **MOD CALLED**`,
        `- *Room: ${roomName}*`,
        `- *Caller: ${callerName}*`,
        `- *ID: \`${playerId}\`*`,
        `- *Call ${count}/${LIMIT}*`,
        `@everyone`,
        ``,
        `-# made by unity.lolz`,
      ].join("\n"),
    }),
  });

  if (!r.ok) return res.status(502).json({ error: "discord request failed" });
  return res.status(200).json({ success: true });
}
