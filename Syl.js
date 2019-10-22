const TelegramBot = require('node-telegram-bot-api');
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')
const {TodoistItemModel} = require('./Models/TodoistItem.js')
const {TodoistProjectModel} = require('./Models/TodoistProject.js')
const {TodoistLabelModel} = require('./Models/TodoistLabel.js')
const fetch = require("node-fetch");
const {gr} = require('./goodreads.js')
const generadorInsultos = require('./generadorInsultos')

const youtubeSearch = require('youtube-search')
var YoutubeMp3Downloader = require("youtube-mp3-downloader");
var youtubeOpts = {
  maxResults: 1,
  key: process.env.YOUTUBE_KEY,
  type: 'video'
};

var YD = new YoutubeMp3Downloader({
  "ffmpegPath": "./ffmpeg",        // Where is the FFmpeg binary located?
  "outputPath": "./mp3",    // Where should the downloaded and encoded files be stored?
  "youtubeVideoQuality": "highest",       // What video quality should be used?
  "queueParallelism": 20,                  // How many parallel downloads/encodes should be started?
  "progressTimeout": 2000                 // How long should be the interval of the progress reports
});

var xkcd = require('xkcd-api');

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
    bot = this.addTodoistEndpoints(bot);

    bot = this.addUtilEndpoints(bot);
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

    createTodoistDB(msg) {
      this.sendMessage(msg.chat.id, 'Hola')
      fetch(`${address}/createtodoistdb?user=${msg.chat.id}`)
      .then(function(response) {
        return response.json();
      }).then(resp => {
        this.sendMessage(msg.chat.id, JSON.stringify(resp))
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
    return this.bot.sendPhoto(chatId, photo)
  }

  setChatAction(chatId, action) {
    this.bot.sendChatAction(chatId, action)
  }

  sendAudio(chatId, audio) {
    return this.bot.sendAudio(chatId, audio)
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
    bot.onText(/\/animalico/, this.getAnimalico.bind(this))
    bot.onText(/\/gatete/, this.getGatete.bind(this))
    bot.onText(/\/perrete/, this.getPerrete.bind(this))
    bot.onText(/\/zorrito/, this.getZorrito.bind(this))
    bot.onText(/\/cabrita/, this.getCabrita.bind(this))
    return bot;
  }

  getAnimalico(msg) {
    const animalicoFunctions = [
      this.getGatete, 
      this.getPerrete, 
      this.getZorrito,
      this.getCabrita
    ]
    const randomAnimalicoFunction = animalicoFunctions[Math.floor(Math.random() * animalicoFunctions.length)].bind(this)
    randomAnimalicoFunction(msg)
  }

  getGatete(msg) {
    this.setChatAction(msg.chat.id, 'upload_photo')
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
    this.setChatAction(msg.chat.id, 'upload_photo')
    fetch('https://dog.ceo/api/breeds/image/random', {
      method: 'GET',
    }).then(response => response.json())
      .then(json=>{
        this.sendMessage(msg.chat.id, 'Aqui tienes tu perrete')
        this.sendPhoto(msg.chat.id, json.message)
      })
  }

  getZorrito(msg) {
    this.setChatAction(msg.chat.id, 'upload_photo')
    fetch('https://randomfox.ca/floof/', {
      method: 'GET',
    }).then(response => response.json())
      .then(json=>{
        this.sendMessage(msg.chat.id, 'Aqui tienes tu zorrito')
        this.sendPhoto(msg.chat.id, json.image)
      })
  }

  getCabrita(msg) {
    this.setChatAction(msg.chat.id, 'upload_photo')
    this.sendMessage(msg.chat.id, 'Aqui tienes tu cabrita')
    const randomNumber = Math.random()*9999999999
    this.sendPhoto(msg.chat.id, `https://placegoat.com/1000?random=${randomNumber}`)
  }

  addUtilEndpoints(bot) {
    bot.onText(/\/youtubeSong/, this.downloadYoutubeSong.bind(this))
    bot.onText(/\/xkcd/, this.randomXKCD.bind(this))
    return bot
  }

  downloadYoutubeSong(msg, match) {
    console.log(msg)
    const commandName = '/youtubeSong'
    const songName = msg.text.slice(commandName.length)
    this.setChatAction(msg.chat.id, 'upload_audio')
    youtubeSearch(songName, youtubeOpts, (err, res) => {
      this.setChatAction(msg.chat.id, 'upload_audio')
      console.log(res)
      YD.download(res[0].id);
      let finished = false;
      YD.on("finished", (err, data) => {
        if(finished) return
        else finished = true
        this.setChatAction(msg.chat.id, 'upload_audio')
        this.sendAudio(msg.chat.id, data.file)
        console.log(JSON.stringify(data));
    });
    })
  }

  randomXKCD(msg) {
    this.setChatAction(msg.chat.id, 'upload_photo')
    xkcd.random((error, response) => {
      if (error) {
        console.error(error);
      } else {
        this.sendPhoto(msg.chat.id, response.img, response.safe_title).then(()=> {
          this.sendMessage(msg.chat.id, response.alt, {noInsulto: true})
        })
      }
    });
  }

  addTodoistEndpoints(bot) {
    bot.onText(/\/createtodoistdb/, this.createTodoistDB.bind(this))
    bot.onText(/\/deadline/, this.getDeadline.bind(this))
    return bot;
  }

  
  // Return true if first is sooner than second
  compareDates(first, second) {
    var d1 = first.split('-')
    var d2 = second.split('-')
  
    // Compare Year
    if (d1[0] < d2[0]) return true
    if (d1[0] > d2[0]) return false
  
    // Compare Month
    if (d1[1] < d2[1]) return true
    if (d1[1] > d2[1]) return false
  
    // Compare Day
    if (d1[2] < d2[2]) return true
    if (d1[2] > d2[2]) return false
    return false
  
  }


  getDeadline(msg) {
    TodoistItemModel.
    find({content: 'Fin Asignatura'}).
    exec((err, item) => {
      var deadline = item[0].due
      for (var i = 0; i < item.length; i++) {
        if (this.compareDates(item[i].due, deadline)){
          deadline = item[i].due
        }
      }

      var today = new Date()
      var deadlineDate = new Date(deadline)
      var diffDays = parseInt((deadlineDate - today) / (1000 * 60 * 60 * 24))

      this.sendMessage(msg.chat.id,  `The next deadline is on ${deadline} --- ${diffDays} days left\nTasks left to do: ` , {noInsulto: true})

      this.getSubjectsByDeadline(deadline, item).then(subjects => {
        for (var i = 0; i < subjects.length; i++) {
          console.log(subjects[i].children)
          var modules = subjects[i].children.length
          var tasks = 0

          for (var j = 0; j < modules; j++) {
            tasks += subjects[i].children[j].items.length
          }
          this.sendMessage(msg.chat.id, `*${subjects[i].name}*: ${modules} modules left containing ${tasks} tasks`, {noInsulto: true, parse_mode: 'Markdown'})
        }
      })

    })
  }

  
  getSubjectsByDeadline(deadline, item) {
    return new Promise((resolve, reject) => {
      var subjects = []
      for (var i = 0; i < item.length; i++) {
        if (item[i].due == deadline) {
          subjects.push(item[i].project)
        } 
      }
  
      TodoistProjectModel.
      find({
        '_id' : {
          $in: subjects
        }
      }).
      populate('children').
      exec((err, projects) => {
        resolve(projects)
      })
    })
    
  }
}

module.exports = Syl