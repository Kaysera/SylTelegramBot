const {bot} = require('./bot.js')
const address = 'http://sylbot.ddns.net:3000'
const {gr} = require('./goodreads.js')

require('./database.js')
require('./server.js')

const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')

// TODO: Move these variables to BBDD
var state = 'listening'
var readingShelf = 'currently-reading'
var selectedBook = ''


bot.on('polling_error', (err) => console.error(err))

/**
 * Goodreads Login Process
 */
bot.onText(/\/login/, (msg, match) => {
  
  var query = {chatID: msg.chat.id}
  GoodreadsTokenModel.findOne(query, function(err, result) {
    if (err) throw err;
    if(result == null){
      bot.sendMessage(msg.chat.id, `Click on the following link: ${address}/login?chatid=${msg.chat.id}`)
    }else{
      bot.sendMessage(msg.chat.id, 'You are already logged in!')
    }
  })
})

bot.onText(/\/getShelves/, (msg, match) => {
  var query = {chatID: msg.chat.id}
  GoodreadsTokenModel.findOne(query, function(err, result) {
    if (err) throw err;
    if(result == null){
      bot.sendMessage(msg.chat.id, `You are not logged in. Please use the command /login`)
    }else{
      gr.getUsersShelves(result.goodreadsID).then(res => {
        res.user_shelf.forEach(element => {
          bot.sendMessage(msg.chat.id, `*${element.name}* - ${element.book_count._} books`, {parse_mode: 'Markdown'})
        })
      })
      
    }
  })
})

bot.onText(/\/getBook/, (msg, match) => {

  gr.getBooksByAuthor('175417')
  .then(res => {
    console.log(res.name)
    bot.sendMessage(msg.chat.id, res.name)
  });
  
})

bot.onText(/\/whoami/, (msg, match) => {
  fetch(`${address}/whoami`)
  .then(function(response) {
    return response.json();
  }).then(resp => {
    bot.sendMessage(msg.chat.id, JSON.stringify(resp))
  })
})

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



