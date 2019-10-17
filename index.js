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




