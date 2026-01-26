/**
 * CuratedReels Telegram Bot
 * 
 * A simple bot that responds to commands and handles video submissions.
 * Deploy to Deno Deploy for serverless operation.
 */

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') || '';
const CMS_URL = Deno.env.get('CMS_URL') || '';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    video?: { file_id: string };
  };
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || '';
  const username = message.from.username || message.from.first_name;

  // Handle commands
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    
    switch (command) {
      case '/start':
        await sendMessage(chatId, 
          `👋 Welcome to <b>CuratedReels Bot</b>!\n\n` +
          `I help curate and share videos. Here's what you can do:\n\n` +
          `/help - Show available commands\n` +
          `/status - Check bot status\n\n` +
          `📹 Send me a video to submit for curation!`
        );
        break;
        
      case '/help':
        await sendMessage(chatId,
          `📚 <b>Available Commands</b>\n\n` +
          `/start - Start the bot\n` +
          `/help - Show this message\n` +
          `/status - Check bot status\n\n` +
          `📹 You can also send videos directly to submit them for curation.`
        );
        break;
        
      case '/status':
        await sendMessage(chatId,
          `✅ <b>Bot Status</b>\n\n` +
          `🤖 Bot: Online\n` +
          `📊 CMS: ${CMS_URL || 'Not configured'}\n` +
          `⏰ Time: ${new Date().toISOString()}`
        );
        break;
        
      default:
        await sendMessage(chatId, `❓ Unknown command. Use /help to see available commands.`);
    }
    return;
  }

  // Handle video submissions
  if (message.video) {
    await sendMessage(chatId,
      `📹 <b>Video received!</b>\n\n` +
      `Thanks ${username}! Your video has been queued for review.\n` +
      `File ID: <code>${message.video.file_id.slice(0, 20)}...</code>`
    );
    return;
  }

  // Default response
  await sendMessage(chatId, 
    `👋 Hi ${username}! Use /help to see available commands, or send me a video to submit.`
  );
}

// HTTP Server for webhook
Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
  
  // Health check
  if (url.pathname === '/' || url.pathname === '/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      bot: 'CuratedReels',
      timestamp: new Date().toISOString() 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Webhook endpoint
  if (url.pathname === '/webhook' && request.method === 'POST') {
    try {
      const update: TelegramUpdate = await request.json();
      await handleUpdate(update);
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook error:', error);
      return new Response('Error', { status: 500 });
    }
  }
  
  // Setup webhook
  if (url.pathname === '/setup-webhook' && WEBHOOK_URL && TELEGRAM_TOKEN) {
    const webhookSetup = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${WEBHOOK_URL}/webhook` }),
      }
    );
    const result = await webhookSetup.json();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
});
