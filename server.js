const express = require('express');
const app = express();
const fetch = require("node-fetch");
const address = 'http://sylbot.ddns.net:3000'
const {gr} = require('./goodreads.js')
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')
const {bot} = require('./bot.js')

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
      gr.getCurrentUserInfo().then(info => {
        var tokenPair = gr.dumpAccessToken()
        var chatid = req.query.chatid.split('?')[0]
        var newToken = new GoodreadsTokenModel({chatID: chatid, accessToken: tokenPair.ACCESS_TOKEN, accessSecret: tokenPair.ACCESS_TOKEN_SECRET, goodreadsID: info.user.id})
        newToken.save(function(err, userResult){
          if(err) throw err;
        })
        bot.sendMessage(chatid, 'Successfully logged in')
        res.send('You can close this window')
      })
      
    })
  
  });
  
  app.get('/whoami', (req, res) => {
    gr.initOAuth();
    // token = { ACCESS_TOKEN: 'XXX', ACCESS_TOKEN_SECRET: 'xxxxxx' }
    gr.setAccessToken(token).then(() => {
      gr.getCurrentUserInfo().then(info => {
        res.send(info)
      })
    })
  })
  

  app.get('/test', (req, res) => {
    gr.initOAuth();
    // token = { ACCESS_TOKEN: 'XXX', ACCESS_TOKEN_SECRET: 'xxxxxx' }
    gr.setAccessToken(token).then(() => {
      gr.setReadStatus('33633687', '64').then(result => {
        res.send(result)
      })
    })


  })


  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });