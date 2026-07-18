const WEBHOOK = process.env.DISCORD_WEBHOOK_URL1;

// All known cosmetic flags
const ALL_FLAGS = ["LBAAD.", "LBAAK.", "LBAAZ.", "COFOUNDER.", "MILKBADGE.", "FORESTGUIDE." ];

// Staff names (from your backend / config)
const STAFF_NAMES = {
  "6F4FBE2BCA16068A": "Tempted",
  "B80667DDCD44DC17": "Tempted",
  "BF29B79A2B400090": "Milk",
  "DB8E46A11F243DD3": "purplegirl",
  "DD84C718E8AFD777": "SOT",
  "B716F79A9FC37CC9": "DADDY TOAST :33",
  "59FE193D73752516": "Hasser",
  "5433C00BD5343624": "Jax",
  "56BAE470B62F4CDD": "Notagirl",
  "71469BA4796CD3E4": "no bunny",
  "CDAD910551C5B3C5": "Cl0udz",
  "BB75C720D543C50C": "JAXJR",
  "EA12FC6A4F8AF723": "PRINCESS",
  "2A4D748DEE715B68": "FLOWERY BOI",
  "4AB371870F86220B": "NASTY PLEMBA",
  "CEF3083A3BE0F883": "Techno",
  "4F5C99FA420D8B74": "table",
  "8F5748B622B6F323": "MOMMY FLOWERS :3",
  "7F5D7550CC93FFE6": "UNDERAGE GUINEA",
  "A1E0B337A62E068E": "crazy",
  "35764A5E18580CF": "cat",
  "8804634281761F0": "CASS",
  "BE8B92C281A82DC5": "Notagirl",
  "B5346D0CA3982424": "GUINEA"
};

// Per-player whitelist: map of playerId -> array of allowed flags (or "*" for all)
const WHITELIST = {
  "6F4FBE2BCA16068A": "*",  // unity
  "B80667DDCD44DC17": "*",  // unity
  "BF29B79A2B400090": "*",  // milk
  "AD6D4E9FB44E6C0C": "LBAAK.",  // crazy
  "56BAE470B62F4CDD": "LBAAK.",  // notagirl
  "DB8E46A11F243DD3": "*",  // purplegirl
  "59FE193D73752516": "LBAAK.",  // hasser
  "6BA57D0913FA0FD7": "LBAAK.",  // ᴿᵉˢᵖᵉᶜᵗsandman
  "B5346D0CA3982424": "LBAAK.",  // guinea
  "4F5C99FA420D8B74": ["LBAAK.", "LBAAZ."],  // TABLE
  "9F3619E3FB5953E0": "LBAAZ.",  // zenngt
  "DC493DEB24FDD9B7": "LBAAZ.",  // AydenVR
  "CDAD910551C5B3C5": ["LBAAK.", "LBAAZ."],  // cl0udz
  "EA12FC6A4F8AF723": "LBAAK.",  // princess
  "2A4D748DEE715B68": ["LBAAK.", "LBAAZ."],  // FLOWERY
  "4AB371870F86220B": ["LBAAK.", "FORESTGUIDE."],  // plemba
  "CF17CC675112D85A": ["LBAAZ.", "LBAAK."],  // Lazybeans
  "CEF3083A3BE0F883": "*",  // techno
  "5ADD21B0BF6FB425": ["LBAAK.", "LBAAZ."],  // mrsandman
  "35764A5E18580CF": ["LBAAK.", "LBAAZ."],  // cat
  "C2619AF7FA41850": ["LBAAK.", "LBAAZ."],  // knpo
  "E65680A2803EFB53": ["LBAAK.", "FORESTGUIDE."],  // sin
  "8F5748B622B6F323": "*",  // Flowers
  "A323BD691D53346D": ["LBAAK.", "LBAAZ."],  // 𝚅𝚎𝚕𝚘  - Tempted Jr
  "5433C00BD5343624": "LBAAK.",  // JAX
  "71469BA4796CD3E4": ["LBAAK.", "LBAAZ.", "FORESTGUIDE."],  // bunny
  "C7FA6FECFEAE36F0": ["MMSHIRT.", "LBAAZ.", "LBAAK."],  // awesomefrog
  "E7DF087A7D57AA49": ["FORESTGUIDE.", "LBAAK."],  // prince
  "57463AEA9D3A4DDE": "MMSHIRT.",  // zigzag [CC]
  "DC3D706F67A113F4": "MMSHIRT.",  // fredsvr [CC]
  "F9310ABE4BCC9D4A": "MMSHIRT.",  // reaper
  "8511A72B68482A3E": "MMSHIRT.",  // zyro [CC]
  "6D465E9DF79A4036": "LBAAK.",  // dh9a
  "857D1E85574C9130": ["LBAAK.", "FORESTGUIDE.", "LBAAZ."],  // f1
  "144307CFFF9493B1": "*",  // flwoers
  "B716F79A9FC37CC9": "*",  // toast
  "DD84C718E8AFD777": ["LBAAK.", "FORESTGUIDE.", "COFOUNDER."],  // salt/sot
  "8AB439F43386ABDE": ["LBAAZ.", "LBAAK."],  // Enzo
  "D4C5246F8626183": ["LBAAZ.", "LBAAK."],  // Gunna
  "9F14D86AD3F591F8": ["LBAAZ.", "FORESTGUIDE.", "LBAAK."],  // vp3
  "4E13F2276A9D2180": "LBAAZ.",  // Dxllz
  "E2B0AC15801DC134": ["LBAAK.", "FORESTGUIDE."],  // vext
  "811906DA324ABB9A": "*",  // gubba
  "7D523422405EA223": "LBAAK.",  // fahh
  "9F11119FB43E872": "LBAAZ.",  // levi
  "44B50AADC4D63447": "LBAAZ.",  // kiwi
  "F12A3F2DCAD4FE0A": "LBAAZ.",  // peanut
};

// Content creator whitelist: playerId -> name
// Managed via Discord bot cc-add / cc-remove commands
const CONTENT_CREATOR_WHITELIST = {
  "7F1D5737D28D4C97": "crow",  // crow
  "C7FA6FECFEAE36F0": "frog",  // frog
  "AB3EC4775687C992": "TFM instinct",  // TFM instinct
  "12F1F839A85B44E7": "Cookievr",  // Cookievr
  "DE9F1EA52A984409": "Cookievr283",  // Cookievr283
  "57463AEA9D3A4DDE": "zigzag",  // zigzag
  "DC3D706F67A113F4": "fredsvr",  // fredsvr
  "F9310ABE4BCC9D4A": "reaper",  // reaper
  "8511A72B68482A3E": "zyro",  // zyro
  "63D509C4513DA1E5": "TBRGEKUPLAY",  // TBRGEKUPLAY
  "2590C0FB2C86E7B5": "horizon",  // horizon
  "C2619AF7FA41850": "knpo",  // knpo
  "F9ACC85F5E8F8C": "eclipse",  // eclipse
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
