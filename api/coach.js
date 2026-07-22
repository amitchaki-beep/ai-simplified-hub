// Vercel serverless function — keeps the Anthropic API key on the server.
// The browser never sees this key; it only talks to /api/coach.
// Set ANTHROPIC_API_KEY in your Vercel project's Environment Variables.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      content: [{ type: "text", text: "The AI Coach isn't configured yet — ANTHROPIC_API_KEY is missing on the server." }],
    });
  }

  try {
    const { system, messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await response.json();
    res.status(response.ok ? 200 : 500).json(data);
  } catch (err) {
    res.status(500).json({
      content: [{ type: "text", text: "Server error reaching the AI. Please try again." }],
    });
  }
}
