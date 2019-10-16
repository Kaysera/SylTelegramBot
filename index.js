require('dotenv').config()

const mongoose = require('mongoose');
const Syl = require('./Syl')
const express = require('express');
const fetch = require("node-fetch");
const goodreads = require('goodreads-api-node');
const {gr} = require('./goodreads.js')
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')

const app = express();
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });

const SylBot = new Syl();

app.get('/', function (req, res) {
  res.send('Hello there, General Kenobi')
});

app.get('/login', function (req, res) {
  gr.initOAuth(`${address}/oauth_callback?chatid=${req.query.chatid}`);
  gr.getRequestToken().then(url => {
    res.redirect(url)
  })
});

app.get('/oauth_callback', function (req, res) {
  gr.getAccessToken().then(() => {
    var tokenPair = gr.dumpAccessToken()
    var chatid = req.query.chatid.split('?')[0]
    var newToken = new GoodreadsTokenModel({chatID: chatid, accessToken: tokenPair.ACCESS_TOKEN, accessSecret: tokenPair.ACCESS_TOKEN_SECRET})
    newToken.save(function(err, userResult){
      if(err) throw err;
    })
    bot.sendMessage(chatid, 'Successfully logged in')
    res.send('You can close this window')
  })
});

app.get('/whoami', (req, res) => {
  gr.initOAuth();
  //token = { ACCESS_TOKEN: 'XXX', ACCESS_TOKEN_SECRET: 'XXXXXX' }
  gr.setAccessToken(token).then(() => {
    gr.getCurrentUserInfo().then(info => {
      res.send(info)
    })
  })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});



bot.onText(/\/saluda/, (msg, match) => {
  bot.sendMessage(msg.chat.id, 'Hi, my name is Syl. How can I help you?')
})

bot.onText(/\/setpercent/, (msg, match) => {

  if (selectedBook === ''){
    bot.sendMessage(msg.chat.id, `No book selected`)
    return
  }

  var query = {chatID: msg.chat.id}
  var percent = match.input.split(' ')[1]
  if (percent < 0 || percent > 100 || isNaN(percent)) {
    bot.sendMessage(msg.chat.id, `Percentage not valid`)
    return
  }

  GoodreadsTokenModel.findOne(query, function(err, result) {
    if (err) throw err;
    if(result == null){
      bot.sendMessage(msg.chat.id, `You are not logged in. Please use the command /login`)
    }else{
      gr.initOAuth();
      token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
      gr.setAccessToken(token).then(() => {
        gr.setReadPercent(selectedBook, percent).then(result => {
          console.log(result)
          bot.sendMessage(msg.chat.id, `Book progress updated successfully!`)
          selectedBook = ''
        })
      })
    }
  })

})

bot.onText(/\/setpage/, (msg, match) => {

  if (selectedBook === ''){
    bot.sendMessage(msg.chat.id, `No book selected`)
    return
  }

  var query = {chatID: msg.chat.id}
  var page = match.input.split(' ')[1]
  // TODO: Comprobar si la página está dentro del rango del libro
  // if (percent < 0 || percent > 100 || isNaN(percent)) {
  //   bot.sendMessage(msg.chat.id, `Percentage not valid`)
  //   return
  // }

  GoodreadsTokenModel.findOne(query, function(err, result) {
    if (err) throw err;
    if(result == null){
      bot.sendMessage(msg.chat.id, `You are not logged in. Please use the command /login`)
    }else{
      gr.initOAuth();
      token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
      gr.setAccessToken(token).then(() => {
        gr.setReadPage(selectedBook, page).then(result => {
          console.log(result)
          bot.sendMessage(msg.chat.id, `Book progress updated successfully!`)
          selectedBook = ''
        })
      })
    }
  })

})

bot.onText(/\/updatebookprogress/, (msg, match) => {

  var query = {chatID: msg.chat.id}
  var keyboard = []
  GoodreadsTokenModel.findOne(query, function(err, result) {
    if (err) throw err;
    if(result == null){
      bot.sendMessage(msg.chat.id, `You are not logged in. Please use the command /login`)
    }else{
      gr.initOAuth();
      token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
      gr.setAccessToken(token).then(() => {
        gr.getBooksOnUserShelf(result.goodreadsID, readingShelf).then(res => {
          var myBooks = res.books.book;
          for (var element in myBooks) {
            var book = [{text: `${myBooks[element].title} - ${myBooks[element].authors.author.name}`, callback_data: `updatebookprogress - ${myBooks[element].id._} - ${element}`}]
            keyboard.push(book)
          }
          bot.sendMessage(msg.chat.id, `Select the book you want to update: `, {reply_markup: {inline_keyboard: keyboard}})
        })
      })
    }
  })

})


// Handle callback queries
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  if (action.includes('updatebookprogress')) {
    selectedBook = action.split('-')[1].trim()
    bot.sendMessage(msg.chat.id, `You have selected *${msg.reply_markup.inline_keyboard[action.split('-')[2].trim()][0].text}*\n\nTo set the progress, use /setpage or /setpercent followed by the new progress`, {parse_mode: 'Markdown'});
  }
});



