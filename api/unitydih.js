const WEBHOOK = process.env.DISCORD_WEBHOOK_URL1;

// All known cosmetic flags
const ALL_FLAGS = ["LBAAD.", "LBAAK.", "LBAAZ.", "COFOUNDER.", "MILKBADGE."];

// Per-player whitelist: map of playerId -> array of allowed flags (or "*" for all)
// "*" means the player is allowed ALL cosmetics
const WHITELIST = {
  "6F4FBE2BCA16068A": "*",          // unity
  "B80667DDCD44DC17": "*",          // unity
  "BF29B79A2B400090": "*", // milk
  "AD6D4E9FB44E6C0C": "LBAAK.",          // crazy
  "56BAE470B62F4CDD": "*",          // notagirl
  "DB8E46A11F243DD3": "LBAAK.",          // purplegirl
  "DD84C718E8AFD777": "LBAAK.",          // sot
  "59FE193D73752516": "LBAAK.",          // hasser
  "56BAE470B62F4CDD": "LBAAK.",           // notagirl
  "71469BA4796CD3E4": ["LBAAK.", "LBAAZ.", "LBAAD."],        // bunny
  "6BA57D0913FA0FD7": "LBAAK.",          // ᴿᵉˢᵖᵉᶜᵗsandman
  "B5346D0CA3982424": "LBAAK.",          // guinea
  "4F5C99FA420D8B74": ["LBAAK.", "LBAAZ."],          // table
  "9F3619E3FB5953E0": "LBAAZ.",          // zenngt
  "DC493DEB24FDD9B7": "LBAAZ.",          // AydenVR
  "8804634281761F0":  ["LBAAK.", "LBAAZ."],          // cazz
  "CDAD910551C5B3C5": "LBAAZ.",          // cl0udz
  "BB75C720D543C50C": ["LBAAK.", "LBAAZ."],          // jaxjr
  "EA12FC6A4F8AF723": "LBAAK.",          // princess
  "2A4D748DEE715B68": "LBAAK.",          // flowery boi
  "4AB371870F86220B": "LBAAK.",          // nasty plemba
  "CF17CC675112D85A": "LBAAZ.",          // lazybeans
  "CEF3083A3BE0F883": "*",          // techno
  "2A4D748DEE715B68": ["LBAAK.", "LBAAZ."],   // FLOWERY
  "7F5D7550CC93FFE66": ["LBAAK.", "LBAAZ."],   // GUINEA
  "DD84C718E8AFD777":  ["LBAAK.", "LBAAZ."], //sot
  "A1E0B337A62E068E": "*",//CRAZY
};

// Returns which flags a player is allowed to have.
// Returns ALL_FLAGS if "*", returns the array if specific, returns [] if not whitelisted.
function getAllowedFlags(playerId) {
  const entry = WHITELIST[playerId];
  if (!entry) return [];
  if (entry === "*") return ALL_FLAGS;
  if (Array.isArray(entry)) return entry;
  return [entry];
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const secret = process.env.MODERATOR_SECRET;
  if (secret && req.headers["x-moderator-secret"] !== secret)
    return res.status(401).json({ error: "unauthorized" });

  if (!WEBHOOK) return res.status(500).json({ error: "webhook not configured" });

  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: "missing playerId" });

  const allowedFlags = getAllowedFlags(playerId);
  const isFullyWhitelisted = allowedFlags.length === ALL_FLAGS.length;

  // Staff with full access — send join notification and skip inventory check
  if (isFullyWhitelisted) {
    await sendWebhook({
      embeds: [{
        title: "cosmetics allowed",
        description: `A staff \`${playerId}\` has joined the game.`,
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

  // Fetch inventory for everyone else (includes partial whitelist players)
  let inv;
  try {
    const data = await playfabRequest("GetUserInventory", { PlayFabId: playerId });
    inv = data.Inventory ?? [];
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "failed to get inventory" });
  }

  // Split items into allowed (whitelisted) vs bad (not whitelisted)
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

  // Partial whitelist player joining cleanly — report their allowed cosmetics
  if (bad.length === 0) {
    if (allowed.length > 0) {
      await sendWebhook({
        embeds: [{
          title: "cosmetics allowed",
          description: `\`${playerId}\` joined with staff cosmetics.`,
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

  // Player has cosmetics they shouldn't — get their IP, revoke, and ban
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

  const embedFields = [
    { name: "Player ID", value: `\`${playerId}\``, inline: true },
    { name: "cos taken", value: bad.map(b => `\`${b.name}\``).join("\n"), inline: false },
  ];

  // If they had some allowed cosmetics too, show those as well
  if (allowed.length > 0) {
    embedFields.push({
      name: "Allowed cosmetics",
      value: allowed.map(a => `\`${a.name}\``).join("\n"),
      inline: false,
    });
  }

  await sendWebhook({
    embeds: [{
      title: "why do you have cosmetics",
      color: 16711680,
      fields: embedFields,
      footer: { text: "made by unity" },
      timestamp: new Date().toISOString(),
    }],
  });

  return res.status(200).json({ status: "terminated" });
}
