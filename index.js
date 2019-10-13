
const {bot} = require('./bot.js')
const address = 'http://sylbot.ddns.net:3000'

require('./database.js')
require('./server.js')

const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')

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



