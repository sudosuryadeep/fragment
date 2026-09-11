import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL;
const BOT_USERNAME = process.env.BOT_USERNAME;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function telegram(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing");

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Telegram API HTTP ${response.status}`);
  }

  return response.json();
}

function makeMiniAppLink(startParam = "demo") {
  if (!BOT_USERNAME) throw new Error("BOT_USERNAME is missing");

  return `https://t.me/${BOT_USERNAME}/offer?startapp=${encodeURIComponent(startParam)}`;
}

export async function POST(request: NextRequest) {
  try {
    if (WEBHOOK_SECRET) {
      const incomingSecret = request.headers.get("x-telegram-bot-api-secret-token");
      if (incomingSecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const update = await request.json();
    const message = update?.message;

    if (!message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = typeof message.text === "string" ? message.text : "";
    const command = text.trim().split(/\s+/)[0]?.toLowerCase();
    const args = text.trim().split(/\s+/).slice(1);
    const startParam = args[0] || "demo";

    if (command === "/start" || command === "/offer") {
      const link = makeMiniAppLink(startParam);

      await telegram("sendMessage", {
        chat_id: chatId,
        text:
          "Open the auction Mini App below. The optional parameter is passed to the Mini App as start_param.",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "Open Auction",
              url: link,
            },
          ]],
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Return 200 so Telegram does not aggressively retry a malformed/non-critical update.
    return NextResponse.json({ ok: true });
  }
}
