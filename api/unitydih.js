const WEBHOOK = process.env.DISCORD_WEBHOOK_URL1;

const FLAGS = ["LBAAD.", "LBAAK.", "LBAAZ.", "COFOUNDER."];

const WHITELIST = [
  "6F4FBE2BCA16068A", // unity
  "B80667DDCD44DC17", // unity
  "BF29B79A2B400090", // milk
  "AD6D4E9FB44E6C0C", // crazythenigger
];

async function playfabRequest(endpoint, body) {
  const titleId = process.env.PLAYFAB_TITLE_ID;
  const secret = process.env.PLAYFAB_SECRET_KEY;

  const r = await fetch(`https://${titleId}.playfabapi.com/Admin/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-SecretKey": secret },
    body: JSON.stringify(body),
  });

  const json = await r.json();
  if (!r.ok || json.status !== "OK") throw new Error(`PlayFab ${endpoint} failed: ${JSON.stringify(json)}`);
  return json.data;
}

async function sendWebhook(payload) {
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const secret = process.env.MODERATOR_SECRET;
  if (secret && req.headers["x-moderator-secret"] !== secret)
    return res.status(401).json({ error: "unauthorized" });

  if (!WEBHOOK) return res.status(500).json({ error: "webhook not configured" });

  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: "missing playerId" });

  if (WHITELIST.indexOf(playerId) !== -1) {
    await sendWebhook({
      embeds: [{
        title: "cosmetics allowed",
        description: `A staff \`${playerId}\` has joined the game.`,
        color: 5814783,
        footer: { text: "made by unity" },
        timestamp: new Date().toISOString(),
      }],
    });
    return res.status(200).json({ status: "authorized" });
  }

  let inv;
  try {
    const data = await playfabRequest("GetUserInventory", { PlayFabId: playerId });
    inv = data.Inventory ?? [];
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "failed to get inventory" });
  }

  const bad = [];
  for (const item of inv) {
    for (const flag of FLAGS) {
      if (item.ItemId.indexOf(flag) !== -1) {
        bad.push({ name: item.ItemId, instance: item.ItemInstanceId });
      }
    }
  }

  if (bad.length === 0) return res.status(200).json({ status: "clean" });

  let ip = null;
  try {
    const data = await playfabRequest("GetPlayerProfile", {
      PlayFabId: playerId,
      ProfileConstraints: { ShowLastLogin: true },
    });
    ip = data.PlayerProfile?.LastLoginAddress ?? null;
  } catch (e) {
    console.error("failed to get player profile:", e);
  }

  for (const item of bad) {
    try {
      await playfabRequest("RevokeInventoryItem", {
        PlayFabId: playerId,
        ItemInstanceId: item.instance,
      });
    } catch (e) {
      console.error(`failed to revoke ${item.name}:`, e);
    }
  }

  try {
    await playfabRequest("BanUsers", {
      Bans: [{
        PlayFabId: playerId,
        ...(ip && { IPAddress: ip }),
        Reason: "NO COSMETICS FOR YOU BOI -MAKE A TICKET AND REQUEST UNITY TO APPEL THE BAN",
        DurationInHours: 175200,
      }],
    });
  } catch (e) {
    console.error("failed to ban player:", e);
  }

  await sendWebhook({
    embeds: [{
      title: "why do you have cosmetics",
      color: 16711680,
      fields: [
        { name: "Player ID", value: `\`${playerId}\``, inline: true },
        { name: "Items Revoked", value: bad.map(b => `\`${b.name}\``).join("\n"), inline: false },
      ],
      footer: { text: "made by unity" },
      timestamp: new Date().toISOString(),
    }],
  });

  return res.status(200).json({ status: "terminated" });
}
