const TelegramBot = require('node-telegram-bot-api');
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')
const fetch = require("node-fetch");
const {gr} = require('./goodreads.js')
const generadorInsultos = require('./generadorInsultos')

const botToken = process.env.BOT_TOKEN;
var token
var readingShelf = 'currently-reading'
var selectedBook
const address = process.env.ADDRESS

class Syl {
  constructor() {
    let bot = new TelegramBot(botToken, {polling: true});
    this.bot = bot
    bot = this.configure(bot)
    return this.bot
  }
  configure(bot) {
    bot.on('polling_error', (err) => console.error(err))
    bot.on('callback_query', (callbackQuery) => this.onCallbackQuery(callbackQuery))

    bot = this.addGREndpoints(bot);
    bot = this.addDebugEndpoints(bot);
    bot = this.addAnimalicosEndpoints(bot);
    return bot;
  }
  addGREndpoints(bot) {
    bot.onText(/\/login/, this.loginGR.bind(this))
    bot.onText(/\/saluda/, this.saluda.bind(this))
    bot.onText(/\/updatebookprogress/, this.updateBookProgressGR.bind(this))
    bot.onText(/\/setpercent/, this.setPercentGR.bind(this))
    bot.onText(/\/setpage/, this.setPageGR.bind(this))

    return bot;
  }
  loginGR(msg) {
    var query = {chatID: msg.chat.id}
    GoodreadsTokenModel.findOne(query, (err, result) => {
      if (err) throw err;
      if(result == null){
        this.sendMessage(msg.chat.id, `Click on the following link: ${address}/login?chatid=${msg.chat.id}`)
      }else{
        this.sendMessage(msg.chat.id, 'You are already logged in!')
      }
    })
  }


  saluda(msg) {
    this.sendMessage(msg.chat.id, 'Hi, my name is Syl. How can I help you?')
  }

  updateBookProgressGR(msg) {
      var query = {chatID: msg.chat.id}
      var keyboard = []
      this.checkLoginGR(query, (result) => {
        gr.initOAuth();
          token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
          gr.setAccessToken(token).then(() => {
            gr.getBooksOnUserShelf(result.goodreadsID, readingShelf).then(res => {
              var myBooks = res.books.book;
              for (var element in myBooks) {
                var book = [{text: `${myBooks[element].title} - ${myBooks[element].authors.author.name}`, callback_data: `updatebookprogress - ${myBooks[element].id._} - ${element}`}]
                keyboard.push(book)
              }
              this.sendMessage(msg.chat.id, `Select the book you want to update: `, {reply_markup: {inline_keyboard: keyboard}})
            })
          })
      })
  }

  checkLoginGR(query, callback) {
    GoodreadsTokenModel.findOne(query, (err, result)  => {
      if (err) throw err;
      if(result == null){
        this.sendMessage(msg.chat.id, `You are not logged in. Please use the command /login`)
      }else{
        callback(result)
      }
    })
  }

  setPercentGR(msg, match) {
    if (selectedBook === ''){
      this.sendMessage(msg.chat.id, `No book selected`)
      return
    }

    var query = {chatID: msg.chat.id}
    var percent = match.input.split(' ')[1]
    if (percent < 0 || percent > 100 || isNaN(percent)) {
      this.sendMessage(msg.chat.id, `Percentage not valid`)
      return
    }

    this.checkLoginGR(query, (result) => {
        gr.initOAuth();
        token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
        gr.setAccessToken(token).then(() => {
          gr.setReadPercent(selectedBook, percent).then(result => {
            console.log(result)
            this.sendMessage(msg.chat.id, `Book progress updated successfully!`)
            selectedBook = ''
          })
        })
      })
  }

  setPageGR(msg, match) {
    if (selectedBook === ''){
      this.sendMessage(msg.chat.id, `No book selected`)
      return
    }

    var query = {chatID: msg.chat.id}
    var page = match.input.split(' ')[1]
    // TODO: Comprobar si la página está dentro del rango del libro
    // if (percent < 0 || percent > 100 || isNaN(percent)) {
    //   this.sendMessage(msg.chat.id, `Percentage not valid`)
    //   return
    // }

    this.checkLoginGR(query, (result) => {
        gr.initOAuth();
        token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
        gr.setAccessToken(token).then(() => {
          gr.setReadPage(selectedBook, page).then(result => {
            console.log(result)
            this.sendMessage(msg.chat.id, `Book progress updated successfully!`)
            selectedBook = ''
          })
        })
      })
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
  sendMessage(chatId, message, opts) {
    if(opts && opts.noInsulto) {
      this.bot.sendMessage(chatId, message, opts)
      return;
    }
    const insulto = generadorInsultos();
    const endChars = '?!,:'
    var msg = (endChars.includes(message.trim().slice(-1))) ? `${message.trim().slice(0,-1)}, ${insulto}${message.trim().slice(-1)}` : `${message.trim()}, ${insulto}`
    this.bot.sendMessage(chatId, msg, opts)
  }
  sendPhoto(chatId, photo) {
    this.bot.sendPhoto(chatId, photo)
  }

  onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    if (action.includes('updatebookprogress')) {
      selectedBook = action.split('-')[1].trim()
      this.sendMessage(msg.chat.id, `You have selected *${msg.reply_markup.inline_keyboard[action.split('-')[2].trim()][0].text}*\n\nTo set the progress, use /setpage or /setpercent followed by the new progress`, {parse_mode: 'Markdown'});
    }
  }
  addAnimalicosEndpoints(bot) {
    bot.onText(/\/gatete/, this.getGatete.bind(this))
    bot.onText(/\/perrete/, this.getPerrete.bind(this))
    bot.onText(/\/zorrito/, this.getZorrito.bind(this))
  }
  getGatete(msg) {
    fetch('https://api.thecatapi.com/v1/images/search', {
      method: 'GET',
      headers: {
        'x-api-key': '6efc7324-7195-4db1-accc-328020dd0e8f'
      }
    }).then(response => response.json())
      .then(json=>{
        this.sendMessage(msg.chat.id, 'Aqui tienes tu gatete')
        this.sendPhoto(msg.chat.id, json[0].url)
      })
  }
  getPerrete(msg) {
    fetch('https://dog.ceo/api/breeds/image/random', {
      method: 'GET',
    }).then(response => response.json())
      .then(json=>{
        this.sendMessage(msg.chat.id, 'Aqui tienes tu perrete')
        this.sendPhoto(msg.chat.id, json.message)
      })
  }
  getZorrito(msg) {
    fetch('https://randomfox.ca/floof/', {
      method: 'GET',
    }).then(response => response.json())
      .then(json=>{
        this.sendMessage(msg.chat.id, 'Aqui tienes tu zorrito')
        this.sendPhoto(msg.chat.id, json.image)
      })
  }
}

module.exports = Syl