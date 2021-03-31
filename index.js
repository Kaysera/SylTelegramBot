require('dotenv').config()

const Syl = require('./Syl')
const express = require('express');
const {gr} = require('./goodreads.js')
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')

const app = express();
const SylBot = new Syl();

app.get('/', function (req, res) {
  res.send('Hello there, General Kenobi')
});

app.get('/login', function (req, res) {
  gr.initOAuth(`${address}/oauth_callback?chatid=${req.query.chatid}`);
  gr.getRequestToken().then(url => {
    console.log(url)
    res.redirect(url)
  })
});

app.get('/test', (req, res) => {
  res.send('Test')
})

app.get('/oauth_callback', function (req, res) {
  gr.getAccessToken().then(() => {
    var tokenPair = gr.dumpAccessToken()
    var chatid = req.query.chatid.split('?')[0]
    var newToken = new GoodreadsTokenModel({chatID: chatid, accessToken: tokenPair.ACCESS_TOKEN, accessSecret: tokenPair.ACCESS_TOKEN_SECRET})
    newToken.save(function(err, userResult){
      if(err) throw err;
    })
    SylBot.sendMessage(chatid, 'Successfully logged in')
    res.send('You can close this window')
  })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});




