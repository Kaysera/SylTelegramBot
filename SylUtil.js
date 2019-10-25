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
    return bot
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
      for(var i = 0; i < diceRoll[0]; i++) {
          scores.push(Math.floor(Math.random() * diceRoll[1]) + 1)
      }
      this.botbase.sendMessage(msg.chat.id, `${scores.join(' + ')} = ${scores.reduce((accum, current) => accum += current)}`)
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


}

module.exports = SylUtil