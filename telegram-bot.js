const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true, request: {
    agentOptions: {
        keepAlive: true,
        family: 4
    }, 
    url: "https://api.telegram.org",
} });

const chatId = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramNotification(deposit) {
  const message = `New Deposit Detected!
  - Transaction Hash: ${deposit.hash}
  - Block Number: ${deposit.blockNumber}
  - Timestamp: ${new Date(deposit.blockTimestamp * 1000).toLocaleString()}
  - Fee: ${deposit.fee} Gwei`;
  
  await telegramBot.sendMessage(chatId, message);
  console.log("Sent Telegram notification for deposit:", deposit.hash);
}


  module.exports = { sendTelegramNotification };