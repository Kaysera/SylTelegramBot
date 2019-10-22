require('dotenv').config()

const mongoose = require('mongoose');
const Syl = require('./Syl')
const express = require('express');
const fetch = require("node-fetch");
const {gr} = require('./goodreads.js')
const {GoodreadsTokenModel} = require('./Models/GoodreadsToken.js')
const {TodoistItemModel} = require('./Models/TodoistItem.js')
const {TodoistProjectModel} = require('./Models/TodoistProject.js')
const {TodoistLabelModel} = require('./Models/TodoistLabel.js')

const app = express();
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
const SylBot = new Syl();

app.get('/', function (req, res) {
  console.log('Patata')
  res.send('Hello there, General Kenobi')
});

app.get('/login', function (req, res) {
  gr.initOAuth(`${address}/oauth_callback?chatid=${req.query.chatid}`);
  gr.getRequestToken().then(url => {
    res.redirect(url)
  })
});

app.get('/createtodoistdb', (req, res) => {
  var user = req.query.user
  var apiURL = "https://todoist.com/API/v8/sync";
  var resources = 'projects'
  var queryString = "?token=" + process.env.TODOIST_TOKEN + "&sync_token=%27*%27&resource_types=[%22" + resources + "%22]";
  var url = apiURL + queryString
  fetch(url, {
    method: 'GET', // or 'PUT'
    headers:{
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(response => {
    var projects = response.projects
    resources = 'items'
    queryString = "?token=" + process.env.TODOIST_TOKEN + "&sync_token=%27*%27&resource_types=[%22" + resources + "%22]";
    url = apiURL + queryString
    fetch(url, {
      method: 'GET', // or 'PUT'
      headers:{
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(resit => resit.json())
      .catch(error => console.error('Error:', error))
      .then(its => {
        var items = its.items
        resources = 'labels'
        queryString = "?token=" + process.env.TODOIST_TOKEN + "&sync_token=%27*%27&resource_types=[%22" + resources + "%22]";
        url = apiURL + queryString
        fetch(url, {
          method: 'GET', // or 'PUT'
          headers:{
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then(resit => resit.json())
        .catch(error => console.error('Error:', error))
        .then(its => {
          var labels = its.labels
          processDB(projects, items, labels, user)
        });
    });
  });

  res.json({success: 'Done'})
})

function processDB(projects, items, labels, user) {
  var projectsDict = {}
  for (var i = 0; i < projects.length; i++) {
    projectsDict[projects[i].id] = projects[i]
    projectsDict[projects[i].id].items = []
  }

  for (var i = 0; i < items.length; i++) {
    projectsDict[items[i].project_id].items.push(items[i].id)
    processItem(items[i], user)
  }


  for (var i = 0; i < projects.length; i++) {
    processProject(Object.values(projectsDict)[i], user)
  }

  for(var i = 0; i < labels.length; i++){
    processLabel(labels[i], user)
  }
}

function processLabel(label, user) {
  var newLabel = new TodoistLabelModel({_id: label.id, user: user, name: label.name})
  newLabel.save(function(err, userResult){
    if(err) throw err;
  })
}

function processProject(project, user) {
  var newProject = new TodoistProjectModel({_id: project.id, user: user, name: project.name, parent: project.parent_id, child_order: project.child_order, is_archived: project.is_archived, items: project.items})
  newProject.save(function(err, userResult){
    if(err) throw err;
  })
}

function processItem(item, user) {
  var date
  if (item.due === null){
    date = ''
  }else {
    date = item.due.date
  }
  var newItem = new TodoistItemModel({_id: item.id, user: user, project: item.project_id, content: item.content, due: date, child_order: item.child_order, labels: item.labels, checked: item.checked})
  newItem.save(function(err, userResult){
    if(err) throw err;
  })
}

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




