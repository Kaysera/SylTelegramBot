const SylUtil = require('./SylUtil')
const SylAnimalicos = require('./SylAnimalicos')
const SylGoodreads = require('./SylGoodreads')
const SylTodoist = require('./SylTodoist')
const SylUCLM = require('./SylUCLM')
const { GoodreadsTokenModel } = require('./Models/GoodreadsToken.js')
const Botbase = require('./Botbase')


class Syl {
  constructor() {
    this.configure()
  }

  configure() {
    this.bb = new Botbase(this.onCallbackQuery.bind(this))
    const SylUtilBot = new SylUtil(this.bb);
    const SylUCLMBot = new SylUCLM(this.bb);
    const SylAnimalicosBot = new SylAnimalicos(this.bb);
//    const SylTodoistBot = new SylTodoist(this.bb); Deprecated
    const SylGoodreadsBot = new SylGoodreads(this.bb);
  }

  onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    if (action.includes('updatebookprogress')) {
      var selectedBook = action.split('-')[1].trim()

      GoodreadsTokenModel.findOne({chatID: msg.chat.id}).then(gr => {
        gr.currentlyReadingBook = selectedBook
        gr.save()
      })
      console.log(action)
      this.bb.sendMessage(msg.chat.id, `You have selected *${msg.reply_markup.inline_keyboard[action.split('-')[2].trim()][0].text}*\n\nTo set the progress, use /setpage or /setpercent followed by the new progress`, { parse_mode: 'Markdown' });
    }
  }

}

module.exports = Syl