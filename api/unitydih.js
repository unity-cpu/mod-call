const WEBHOOK = process.env.DISCORD_WEBHOOK_URL1;

// All known cosmetic flags
const ALL_FLAGS = ["LBAAD.", "LBAAK.", "LBAAZ.", "FORESTGUIDE.",];

// Staff names (from your backend / config)
const STAFF_NAMES = {
};

// Per-player whitelist: map of playerId -> array of allowed flags (or "*" for all)
const WHITELIST = {
  "2A4A7E5AB2C8E8F5 ?": "*",  // sparky
  "2A4A7E5AB2C8E8F5": "*",  // sparky
};

// ── Helpers ──────────────────────────────────────────────────

function getAllowedFlags(playerId) {
  const entry = WHITELIST[playerId];
  if (!entry) return [];
  if (entry === "*") return ALL_FLAGS;
  if (Array.isArray(entry)) return entry;
  return [entry];
}

function isContentCreator(playerId) {
  return playerId in CONTENT_CREATOR_WHITELIST;
}

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

// ── Handler ──────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const secret = process.env.MODERATOR_SECRET;
  if (secret && req.headers["x-moderator-secret"] !== secret)
    return res.status(401).json({ error: "unauthorized" });

  if (!WEBHOOK) return res.status(500).json({ error: "webhook not configured" });

  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: "missing playerId" });

  const allowedFlags       = getAllowedFlags(playerId);
  const isFullyWhitelisted = allowedFlags.length === ALL_FLAGS.length;
  const isCC               = isContentCreator(playerId);
  const ccName             = isCC ? CONTENT_CREATOR_WHITELIST[playerId] : null;

  // Full-access staff — send join notification and skip inventory check
  if (isFullyWhitelisted) {
    const staffName = STAFF_NAMES[playerId] || "unknown staff";
    await sendWebhook({
      embeds: [{
        title: "cosmetics allowed",
        description: `**${staffName}** (\`${playerId}\`) has joined the game.`,
        color: 5814783,
        fields: [
          {
            name: "Allowed cosmetics",
            value: ALL_FLAGS.map(f => `\`${f}\``).join("\n"),
            inline: false,
          },
        ],
        footer: { text: "made by unity" },
        timestamp: new Date().toISOString(),
      }],
    });
    return res.status(200).json({ status: "authorized" });
  }

  // Fetch inventory for everyone else (partial whitelist + CCs + unknowns)
  let inv;
  try {
    const data = await playfabRequest("GetUserInventory", { PlayFabId: playerId });
    inv = data.Inventory ?? [];
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "failed to get inventory" });
  }

  // Split items into allowed vs bad
  const allowed = [];
  const bad = [];

  for (const item of inv) {
    for (const flag of ALL_FLAGS) {
      if (item.ItemId.indexOf(flag) !== -1) {
        if (allowedFlags.includes(flag)) {
          allowed.push({ name: item.ItemId, instance: item.ItemInstanceId });
        } else {
          bad.push({ name: item.ItemId, instance: item.ItemInstanceId });
        }
      }
    }
  }

  // Clean join — report allowed cosmetics if any
  if (bad.length === 0) {
    if (allowed.length > 0) {
      await sendWebhook({
        embeds: [{
          title: "cosmetics allowed",
          description: isCC
            ? `🎥 **${ccName}** (\`${playerId}\`) [Content Creator] joined with staff cosmetics.`
            : `\`${playerId}\` joined with staff cosmetics.`,
          color: 5814783,
          fields: [
            {
              name: "Allowed cosmetics",
              value: allowed.map(a => `\`${a.name}\``).join("\n"),
              inline: false,
            },
          ],
          footer: { text: "made by unity" },
          timestamp: new Date().toISOString(),
        }],
      });
    }
    return res.status(200).json({ status: "clean" });
  }

  // Player has cosmetics they shouldn't — get IP, revoke, and ban
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

  // Use CC-specific ban reason if applicable, otherwise default
  const banReason = isCC
    ? "no content creator cosmetics for u -MAKE A TICKET AND REQUEST PLAYFAB ACCESS TO GET THE COS AND GET RID OF THE BAN"
    : "NO COSMETICS FOR YOU BOI -MAKE A TICKET AND REQUEST UNITY TO APPEL THE BAN";

  try {
    await playfabRequest("BanUsers", {
      Bans: [{
        PlayFabId: playerId,
        ...(ip && { IPAddress: ip }),
        Reason: banReason,
        DurationInHours: 1,
      }],
    });
  } catch (e) {
    console.error("failed to ban player:", e);
  }

  const embedFields = [
    {
      name: "Player ID",
      value: isCC ? `\`${playerId}\` 🎥 **${ccName}** [Content Creator]` : `\`${playerId}\``,
      inline: true,
    },
    { name: "cos taken", value: bad.map(b => `\`${b.name}\``).join("\n"), inline: false },
  ];

  if (allowed.length > 0) {
    embedFields.push({
      name: "Allowed cosmetics",
      value: allowed.map(a => `\`${a.name}\``).join("\n"),
      inline: false,
    });
  }

  await sendWebhook({
    embeds: [{
      title: isCC ? "why do you have cosmetics [CC]" : "why do you have cosmetics",
      color: 16711680,
      fields: embedFields,
      footer: { text: "made by unity" },
      timestamp: new Date().toISOString(),
    }],
  });

  return res.status(200).json({ status: "terminated" });
}
