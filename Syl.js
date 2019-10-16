const TelegramBot = require('node-telegram-bot-api');
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')
const {gr} = require('./goodreads.js')
const generadorInsultos = require('./generadorInsultos')

const token = process.env.BOT_TOKEN;

export default class Syl {
  constructor() {
    let bot = new TelegramBot(token, {polling: true});
    bot = this.configure(bot)

    this.bot = bot
    return this.bot
  }
  configure(bot) {
    bot.on('polling_error', (err) => console.error(err))
    bot = this.addGREndpoints(bot);
    bot = this.addDebugEndpoints(bot);
    return bot;
  }
  addGREndpoints(bot) {
    bot.onText(/\/login/, this.loginGR)
    bot.onText(/\/getBook/,this.getBookGR)
    return bot;
  }
  loginGR(msg) {
    var query = {chatID: msg.chat.id}
    GoodreadsTokenModel.findOne(query, function(err, result) {
      if (err) throw err;
      if(result == null){
        this.sendMessage(msg.chat.id, `Click on the following link: ${address}/login?chatid=${msg.chat.id}`)
      }else{
        this.sendMessage(msg.chat.id, 'You are already logged in!')
      }
    })
  }
  getBookGR(msg) {
    gr.getBooksByAuthor('175417')
    .then(res => {
      console.log(res.name)
      bot.sendMessage(msg.chat.id, res.name)
    });
  }
  addDebugEndpoints(bot) {
    bot.onText(/\/whoami/, this.getUserId)
    return bot;
  }
  getUserId(msg) {
    fetch(`${address}/whoami`)
      .then(function(response) {
        return response.json();
      }).then(resp => {
        bot.sendMessage(msg.chat.id, JSON.stringify(resp))
      })
  }
  sendMessage(chatId, message) {
    const insulto = generadorInsultos();
    this.bot.sendMessage(chatId, `${message}, ${insulto}`)
  }
}