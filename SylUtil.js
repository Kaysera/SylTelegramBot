const xkcd = require('xkcd-api');
const youtubeSearch = require('youtube-search')
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const request = require('request')

const snoowrap = require('snoowrap');

const r = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_ID,
  clientSecret: process.env.REDDIT_SECRET,
  refreshToken: process.env.REDDIT_REFRESH_TOKEN,
});


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


class SylUtil {
  constructor(botbase) {
    this.botbase = botbase
    this.addUtilEndpoints(this.botbase.bot)
  }
  addUtilEndpoints(bot) {
    bot.onText(/\/youtubeSong/, this.downloadYoutubeSong.bind(this))
    bot.onText(/\/saluda/, this.saluda.bind(this))
    bot.onText(/\/xkcd/, this.randomXKCD.bind(this))
    bot.onText(/\/rolldice/, this.rollDice.bind(this))
    bot.onText(/\/fine/, this.apolloFine.bind(this))
    bot.onText(/\/heke/, this.hamtaroHeke.bind(this))
    bot.onText(/\/help/, this.help.bind(this))
    bot.onText(/\/password/, this.passwordGenerator.bind(this))
    bot.onText(/\/coronaspain/, this.coronaSpain.bind(this))
    bot.onText(/https:\/\/www.reddit.com/, this.redditPicture.bind(this))
    return bot
  }



  help(msg) {
    var utilCommands = [
      '/saluda - Greets the user',
      '/youtubeSong song - Sends YouTube song as audio note',
      '/xkcd - Sends a random XKCD comic',
      '/rolldice XdY - Rolls X dice of Y sides and returns the output (maximum 100 dice)',
      '/fine - Returns an Apollo Justice image',
      '/heke - Returns a Hamtaro gif',
      '/password N - generates a random password of N characters (max 4096 characters)',
      'reddit url - sends the image associated with the post'
    ]

    var goodreadsCommands = [
      '/login - Login to your Goodreads account',
      '/updatebookprogress - Set currently reading book',
      '/setpercent - Set currently reading book percent',
      '/setpage - Set currently reading book page',
      '/currentlyreading - Returns currently reading book',
    ]

    var animalicosCommands = [
      '/gatete - Returns a cat picture',
      '/perrete - Returns a dog picture',
      '/zorrito - Returns a fox picture',
      '/cabrita - Returns a goat picture',
      '/animalico - Returns a random animal picture',
    ]

    var todoistCommands = [
      // '/createtodoistdb - Starts a database with your Todoist data',
      '/deadline - Next deadline information (date, tasks...)',
      '/getdailymessage - Message with the tasks for the day'
    ]

    var commands = [
      '*Util commands*\n\t\t\t\t\t' + utilCommands.join('\n\t\t\t\t\t'),
      '*Animalicos commands*\n\t\t\t\t\t' + animalicosCommands.join('\n\t\t\t\t\t'),
      '*Goodreads commands*\n\t\t\t\t\t' + goodreadsCommands.join('\n\t\t\t\t\t'),
      '*Todoist commands (beta)*\n\t\t\t\t\t' + todoistCommands.join('\n\t\t\t\t\t'),
    ]
    
    this.botbase.sendMessage(msg.chat.id, `This is the list of all commands:\n\n${commands.join('\n\n')}`, {noInsulto: true, parse_mode: 'Markdown'})
  }


  saluda(msg) {
    this.botbase.sendMessage(msg.chat.id, 'Hi, my name is Syl. How can I help you?')
  }

  rollDice(msg) {
    const commandName = '/rolldice'
    const diceRoll = msg.text.slice(commandName.length).trim().split('d')

    if(diceRoll.length != 2 || isNaN(diceRoll[0]) || isNaN(diceRoll[1])) {
      this.botbase.sendMessage(msg.chat.id, 'Introduce the right format (XdX) to use the command')
    } else {
      var scores = []
      if(diceRoll[0] < 100) {
        for(var i = 0; i < diceRoll[0]; i++) {
          scores.push(Math.floor(Math.random() * diceRoll[1]) + 1)
        }
        this.botbase.sendMessage(msg.chat.id, `${scores.join(' + ')} = ${scores.reduce((accum, current) => accum += current)}`)
      }else {
        this.botbase.sendMessage(msg.chat.id, `Cannot launch more than 100 dice`)
      }

    }

  }

  passwordGenerator(msg) {
    const commandName = '/password '
    const len = msg.text.slice(commandName.length)

    if(isNaN(len)) {
      this.botbase.sendMessage(msg.chat.id, 'Introduce the right format (/password N) to use the command')
      
    } else {
      var alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&='
      var pass = ''
      if (len <= 4096) {
        for(var i = 0; i < len; i++) {
          pass += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
        }
        this.botbase.sendMessage(msg.chat.id, `${pass}`, {noInsulto: true})
      }
      else {
        this.botbase.sendMessage(msg.chat.id, `Password too long`, {noInsulto: true})
      }

    }

  }

  downloadYoutubeSong(msg, match) {
    console.log(msg)
    const commandName = '/youtubeSong'
    const songName = msg.text.slice(commandName.length)
    this.botbase.sendChatAction(msg.chat.id, 'upload_audio')
    youtubeSearch(songName, youtubeOpts, (err, res) => {
      this.botbase.sendChatAction(msg.chat.id, 'upload_audio')
      console.log(res)
      YD.download(res[0].id);
      let finished = false;
      YD.on("finished", (err, data) => {
        if (finished) return
        else finished = true
        this.botbase.sendChatAction(msg.chat.id, 'upload_audio')
        this.botbase.sendAudio(msg.chat.id, data.file)
        console.log(JSON.stringify(data));
      });
    })
  }

  redditPicture(msg, match) {
    const post = msg.text.split('/')[6]
    r.getSubmission(post).fetch().then(submission => {
      var img = submission.url
      this.botbase.sendChatAction(msg.chat.id, 'upload_photo')
      this.botbase.sendPhoto(msg.chat.id, img)
    });
  }

  randomXKCD(msg) {
    this.botbase.sendChatAction(msg.chat.id, 'upload_photo')
    xkcd.random((error, response) => {
      if (error) {
        console.error(error);
      } else {
        this.botbase.sendPhoto(msg.chat.id, response.img, response.safe_title).then(() => {
          this.botbase.sendMessage(msg.chat.id, response.alt, { noInsulto: true })
        })
      }
    });
  }

  apolloFine(msg) {
    this.botbase.sendChatAction(msg.chat.id, 'upload_photo')
    this.botbase.sendPhoto(msg.chat.id, './img/apollo.jpg')
  }

  hamtaroHeke(msg) {
    this.botbase.sendChatAction(msg.chat.id, 'upload_photo')
    this.botbase.sendDocument(msg.chat.id, './img/hamtaro.gif')
  }

  coronaRequest(msg, url, tipo) {
    var requestClient = request.defaults({jar: true, headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/74.0'}})
    requestClient.get(url, (err, res, body) => {
      if( body.includes('404: Not Found')) { 
        console.log('error')

      } else {
        var firstLine = body.split('\n')[0].split(',')
        var ccaa = 0
        var date = firstLine[firstLine.length-1]
        for (var i in firstLine) {
          if (firstLine[i] === 'CCAA') {
            ccaa = i
          }
        }

        var logs = body.split('\n').slice(1,-1)
        var casos = {}
        for (var i in logs) {
          var elem = logs[i].split(',')
          casos[elem[ccaa]] = parseInt(elem[elem.length - 1])
        }
  
        // Create items array
        var items = Object.keys(casos).map(function(key) {
          return [key, casos[key]];
        });
  
        // Sort the array based on the second element
        items.sort(function(first, second) {
          return second[1] - first[1];
        });
  
        var message = `${tipo} de Coronavirus: ${date}\n`

        for(var i in items) {
          elem = items[i]
          message += `${elem[0]}: ${elem[1]}\n`
        }
  
        this.botbase.sendMessage(msg.chat.id, message, { noInsulto: true })
      }
    })

  }
  

  coronaSpain(msg) {
    var param = msg.text.slice(12).trim()

    if(param === 'casos' || param === '') {
      var url = `https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_casos.csv`
      this.coronaRequest(msg, url, 'Casos')
    } else if (param === 'uci') {
      var url = `https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_uci.csv`
      this.coronaRequest(msg, url, 'UCI')
    } else if (param === 'fallecidos') {
      var url = `https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_fallecidos.csv`
      this.coronaRequest(msg, url, 'Fallecidos')
    } else {
      this.botbase.sendMessage(msg.chat.id, 'No se reconoce el parámetro. Pruebe casos, uci o fallecidos', { noInsulto: true })
    }
    this.coronaRequest(msg, new Date())
  }



}

module.exports = SylUtil