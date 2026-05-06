export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.MODERATOR_SECRET;
  if (secret) {
    const incomingSecret = req.headers["x-moderator-secret"];
    if (incomingSecret !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  const { roomName, callerName, playerId } = req.body;

  if (!roomName || !callerName || !playerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const message = {
    content: `# **A MODERATOR WAS CALLED!**\n- *Room Name: ${roomName}*\n- *Caller Name: ${callerName}*\n- *Player ID: ${playerId}*\n\n-# made by unity.lolz`,
  };

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!discordRes.ok) {
    return res.status(502).json({ error: "Failed to send to Discord" });
  }

  return res.status(200).json({ success: true });
}
