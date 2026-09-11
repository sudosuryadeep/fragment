import "dotenv/config";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Missing BOT_TOKEN in .env");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
