import "dotenv/config";

const token = process.env.BOT_TOKEN;
const appUrl = process.env.MINI_APP_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !appUrl) {
  console.error("Missing BOT_TOKEN or MINI_APP_URL in .env");
  process.exit(1);
}

const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message"],
  }),
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));

if (!data.ok) process.exit(1);
console.log(`Webhook set to: ${webhookUrl}`);
