// Meta Lead Ads webhook — forwards leadgen events to OpenClaw
const OPENCLAW_WEBHOOK = "https://erics-macbook-pro.tail016d6f.ts.net/webhooks/meta-leads";
const VERIFY_TOKEN = "oakas-leads-verify-2026";

export default async function handler(req, res) {
  // GET = Meta verification challenge
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // POST = incoming lead event
  if (req.method === "POST") {
    // Respond to Meta immediately
    res.status(200).send("OK");

    // Forward to OpenClaw
    try {
      await fetch(OPENCLAW_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
    } catch (e) {
      console.error("Failed to forward to OpenClaw:", e.message);
    }
    return;
  }

  res.status(405).send("Method not allowed");
}
