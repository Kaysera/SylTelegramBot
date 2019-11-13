const TelegramBot = require('node-telegram-bot-api');

const generadorInsultos = require('./generadorInsultos')
const botToken = process.env.BOT_TOKEN;


class Botbase {
  constructor(callback) {
    let bot = new TelegramBot(botToken, { polling: true });
    this.bot = bot
    bot = this.configure(bot, callback)
  }

  configure(bot, callback) {
    bot.on('polling_error', (err) => console.error(err))
    bot.on('callback_query', (callbackQuery) => callback(callbackQuery))

    return bot;
  }

  sendMessage(chatId, message, opts) {
    if (opts && opts.noInsulto) {
      this.bot.sendMessage(chatId, message, opts)
      return;
    }
    const insulto = generadorInsultos();
    const endChars = '?!,:'
    var msg = (endChars.includes(message.trim().slice(-1))) ? `${message.trim().slice(0, -1)}, ${insulto}${message.trim().slice(-1)}` : `${message.trim()}, ${insulto}`
    this.bot.sendMessage(chatId, msg, opts)
  }

  sendPhoto(chatId, photo) {
    return this.bot.sendPhoto(chatId, photo)
  }

  sendChatAction(chatId, action) {
    return this.bot.sendChatAction(chatId, action)
  }

  sendAudio(chatId, audio) {
    return this.bot.sendAudio(chatId, audio)
  }

  sendDocument(chatId, audio) {
    return this.bot.sendDocument(chatId, audio)
  }

}

module.exports = Botbase