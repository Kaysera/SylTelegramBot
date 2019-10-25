
var readingShelf = 'currently-reading'
const address = process.env.ADDRESS
const { gr } = require('./goodreads.js')
const { GoodreadsTokenModel } = require('./Models/GoodreadsToken.js')


class SylGoodreads {
  constructor(botbase) {
    this.botbase = botbase
    this.addGREndpoints(this.botbase.bot)
  }
  addGREndpoints(bot) {
    bot.onText(/\/login/, this.loginGR.bind(this))
    bot.onText(/\/updatebookprogress/, this.updateBookProgressGR.bind(this))
    bot.onText(/\/setpercent/, this.setPercentGR.bind(this))
    bot.onText(/\/setpage/, this.setPageGR.bind(this))

    return bot;
  }

  loginGR(msg) {
    var query = { chatID: msg.chat.id }
    GoodreadsTokenModel.findOne(query, (err, result) => {
      if (err) throw err;
      if (result == null) {
        this.botbase.sendMessage(msg.chat.id, `Click on the following link: ${address}/login?chatid=${msg.chat.id}`)
      } else {
        this.botbase.sendMessage(msg.chat.id, 'You are already logged in!')
      }
    })
  }

  updateBookProgressGR(msg) {
    var query = { chatID: msg.chat.id }
    var keyboard = []
    this.checkLoginGR(query, (result) => {
      gr.initOAuth();
      var token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
      gr.setAccessToken(token).then(() => {
        gr.getBooksOnUserShelf(result.goodreadsID, readingShelf).then(res => {
          var myBooks = res.books.book;

          if(res.books.total == 1) {
            var book = [{ text: `${myBooks.title} - ${myBooks.authors.author.name}`, callback_data: `updatebookprogress - ${myBooks.id._} - 0` }]
            keyboard.push(book)
          } else {
            for (var element in myBooks) {
              var book = [{ text: `${myBooks[element].title} - ${myBooks[element].authors.author.name}`, callback_data: `updatebookprogress - ${myBooks[element].id._} - ${element}` }]
              keyboard.push(book)
            }
          }
          this.botbase.sendMessage(msg.chat.id, `Select the book you want to update: `, { reply_markup: { inline_keyboard: keyboard } })
        })
      })
    })
  }

  checkLoginGR(query, callback) {
    GoodreadsTokenModel.findOne(query, (err, result) => {
      if (err) throw err;
      if (result == null) {
        this.botbase.sendMessage(msg.chat.id, `You are not logged in. Please use the command /login`)
      } else {
        callback(result)
      }
    })
  }

  setPercentGR(msg, match) {
    GoodreadsTokenModel.findOne({chatID: msg.chat.id}).then(grt => {
      var selectedBook = grt.currentlyReadingBook
      if (selectedBook == null) {
        this.botbase.sendMessage(msg.chat.id, `No book selected`)
        return
      }
  
      var query = { chatID: msg.chat.id }
      var percent = match.input.split(' ')[1]
      if (percent < 0 || percent > 100 || isNaN(percent)) {
        this.botbase.sendMessage(msg.chat.id, `Percentage not valid`)
        return
      }
  
      this.checkLoginGR(query, (result) => {
        gr.initOAuth();
        var token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
        gr.setAccessToken(token).then(() => {
          gr.setReadPercent(selectedBook, percent).then(result => {
            console.log(result)
            this.botbase.sendMessage(msg.chat.id, `Book progress updated successfully!`)
            selectedBook = ''
          })
        })
      })
    })
    
  }

  setPageGR(msg, match) {
    GoodreadsTokenModel.findOne({chatID: msg.chat.id}).then(grt => {
      var selectedBook = grt.currentlyReadingBook
      if (selectedBook == null) {
        this.botbase.sendMessage(msg.chat.id, `No book selected`)
        return
      }

      var query = { chatID: msg.chat.id }
      var page = match.input.split(' ')[1]
      // TODO: Comprobar si la página está dentro del rango del libro
      // if (percent < 0 || percent > 100 || isNaN(percent)) {
      //   this.botbase.sendMessage(msg.chat.id, `Percentage not valid`)
      //   return
      // }

      this.checkLoginGR(query, (result) => {
        gr.initOAuth();
        var token = { ACCESS_TOKEN: result.accessToken, ACCESS_TOKEN_SECRET: result.accessSecret }
        gr.setAccessToken(token).then(() => {
          gr.setReadPage(selectedBook, page).then(result => {
            console.log(result)
            this.botbase.sendMessage(msg.chat.id, `Book progress updated successfully!`)
            selectedBook = ''
          })
        })
      })
    })
  
  }
}

module.exports = SylGoodreads