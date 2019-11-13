const { TodoistItemModel } = require('./Models/TodoistItem.js')
const { TodoistProjectModel } = require('./Models/TodoistProject.js')
const { TodoistLabelModel } = require('./Models/TodoistLabel.js')
const { TodoistPrefsModel } = require('./Models/TodoistPrefs.js')
const { TodoistProgressModel } = require('./Models/TodoistProgress.js')


const fetch = require("node-fetch");
const cron = require('node-cron');
const tzOffset = require("tz-offset")
tzOffset.offsetOf("Europe/Madrid");

const address = process.env.ADDRESS

class SylTodoist {
  constructor(botbase) {
    this.botbase = botbase
    this.addTodoistEndpoints(this.botbase.bot)
  }
  addTodoistEndpoints(bot) {
    bot.onText(/\/createtodoistdb/, this.createTodoistDB.bind(this))
    bot.onText(/\/deadline/, this.getDeadline.bind(this))
    bot.onText(/\/getdailymessage/, this.getDailyMessage.bind(this))
    this.createDailyMessage()
    return bot;
  }

  createTodoistDB(msg) {
    fetch(`${address}/createtodoistdb?user=${msg.chat.id}`)
      .then(function (response) {
        return response.json();
      }).then(resp => {
        this.botbase.sendMessage(msg.chat.id, resp.success)
      })
  }

  createDailyMessage() {
    //TODO: GET FROM DB
    var min = 30
    var hour = 9
    var chatID = process.env.TELEGRAM_CHAT_ID

    cron.schedule(`0 ${min} ${hour} * * *`, () => {
      this.sendDailyMessage(chatID)
    });
  }

  getDailyMessage(msg) {
    console.log(msg.chat.id)
    this.sendDailyMessage(msg.chat.id)
  }

  sendDailyMessage(chatID) {
    this.updateTodoistDB(chatID).then((success) => {
      TodoistItemModel.
        find({ content: 'Fin Asignatura' }).
        exec((err, item) => {
          var deadline = item[0].due
          for (var i = 0; i < item.length; i++) {
            if (this.compareDates(item[i].due, deadline)) {
              deadline = item[i].due
            }
          }

          var today = new Date()
          var deadlineDate = new Date(deadline)
          var diffDays = parseInt((deadlineDate - today) / (1000 * 60 * 60 * 24))


          this.getSubjectsByDeadline(deadline, item).then(subjects => {
            var daySubject = subjects[(new Date().getDate()) % 2]
            var totalTasks = 0
            for (var i = 0; i < subjects.length; i++) {
              var modules = 0
              var tasks = 0
              var subj = subjects[i]

              for (var j = 0; j < subj.children.length; j++) {
                var modtask = 0
                for (var k = 0; k < subj.children[j].items.length; k++) {
                  if (subj.children[j].items[k].checked == 0) {
                    modtask++;
                  }
                }
                tasks += modtask
                if (modtask > 0) {
                  modules++
                }
              }
              totalTasks += tasks
              var percent = this.getSubjectCompletedPercent(daySubject)

              //FIXME: WAIT FOR THIS TO COMPLETE UNTIL NEXT ITERATION OF FOR LOOP
              TodoistProgressModel.findOne({ date: new Date().toLocaleDateString() }).then((progress) => {
                if (progress == null) {
                  var tpm = new TodoistProgressModel({ user: chatID, subject: subj.name, date: new Date().toLocaleDateString(), progress: percent })
                  tpm.save()
                }
              })

            }
            var dayTasks = Math.ceil(totalTasks / diffDays)
            var recTasks = this.getRecommendedTasks(chatID, dayTasks, daySubject)
            percent = this.getSubjectCompletedPercent(daySubject)

            this.botbase.sendMessage(chatID, `Good morning!\n\nThe next deadline is on ${deadline} --- *${diffDays} days left*\n\nToday's subject is: *${daySubject.name}* (${percent.toFixed(2)}% completed)\n\nTasks recommended for today:\n${recTasks.join('\n')}`, { noInsulto: true, parse_mode: 'Markdown' })

          })

        })
    })
  }

  getRecommendedTasks(chatID, dayTasks, subject) {
    var tasks = []
    var tasksleft = 0
    for (var i = 0; i < subject.children.length; i++) {
      for (var j = 0; j < subject.children[i].items.length; j++) {
        if (subject.children[i].items[j].checked == 0) {
          tasks.push('- ' + subject.children[i].items[j].content.replace('_', ' '))
          tasksleft++
          if (tasksleft == dayTasks) {
            break
          }
        }
      }
      if (tasksleft == dayTasks) {
        break
      }
    }

    return tasks
  }

  updateTodoistDB(chatID) {
    return new Promise((resolve, reject) => {
      var user = chatID
      TodoistPrefsModel.findOne({ chatID: user }).then(prefs => {
        var apiURL = "https://todoist.com/API/v8/sync";
        var queryString = "?token=" + process.env.TODOIST_TOKEN + "&sync_token=%27" + prefs.sync_token + "%27&resource_types=[%22labels%22, %22projects%22, %22items%22]";
        var url = apiURL + queryString
        fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then(res => res.json())
          .catch(error => console.error('Error:', error))
          .then(resp => {
            for (var i = 0; i < resp.items.length; i++) {
              var item = resp.items[i]
              var date
              if (item.due === null) {
                date = ''
              } else {
                date = item.due.date
              }
              TodoistItemModel.findByIdAndUpdate(item.id, { project: item.project_id, content: item.content, due: date, child_order: item.child_order, labels: item.labels, checked: item.checked }, (err, it) => {
                if (it == null) {
                  this.processItem(item, user)
                  TodoistProjectModel.findById(item.project_id, (err, project) => {
                    project.items.push(item.id)
                    project.save()
                  })
                }
              })
            }

            prefs.sync_token = resp.sync_token
            prefs.save()



            for (var i = 0; i < resp.labels.length; i++) {
              var item = resp.labels[i]
              TodoistLabelModel.findByIdAndUpdate(item.id, { project: item.project_id, content: item.content, due: date, child_order: item.child_order, labels: item.labels, checked: item.checked }, (err, it) => {
                if (it == null) {
                  this.processLabel(item, user)
                }
              })
            }

            for (var i = 0; i < resp.projects.length; i++) {
              var item = resp.projects[i]
              TodoistProjectModel.findByIdAndUpdate(item.id, { project: item.project_id, content: item.content, due: date, child_order: item.child_order, labels: item.labels, checked: item.checked }, (err, it) => {
                if (it == null) {
                  this.processProject(item, user)
                  TodoistProjectModel.findById(item.parent_id, (err, project) => {
                    if (project != null) {
                      project.children.push(item.id)
                      project.save()
                    }

                  })
                }
              })
            }
            resolve({ success: 'Done' })

          });

      })
    })

  }

  processLabel(label, user) {
    var newLabel = new TodoistLabelModel({_id: label.id, user: user, name: label.name})
    newLabel.save(function(err, userResult){
      if(err) throw err;
    })
  }
  
  processProject(project, user) {
    var newProject = new TodoistProjectModel({_id: project.id, user: user, name: project.name, parent: project.parent_id, child_order: project.child_order, is_archived: project.is_archived, items: project.items, children: project.children})
    newProject.save(function(err, userResult){
      if(err) throw err;
    })
  }
  
  processItem(item, user) {
    if (item == null) return
    var date
    if (item.due == null){
      date = ''
    }else {
      date = item.due.date
    }

    var newItem = new TodoistItemModel({_id: item.id, user: user, project: item.project_id, content: item.content, due: date, child_order: item.child_order, labels: item.labels, checked: item.checked})
    newItem.save(function(err, userResult){
      if(err) throw err;
    })
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
    this.updateTodoistDB(msg.chat.id).then((success) => {

      TodoistItemModel.
        find({ content: 'Fin Asignatura' }).
        exec((err, item) => {
          var deadline = item[0].due
          for (var i = 0; i < item.length; i++) {
            if (this.compareDates(item[i].due, deadline)) {
              deadline = item[i].due
            }
          }

          var today = new Date()
          var deadlineDate = new Date(deadline)
          var diffDays = parseInt((deadlineDate - today) / (1000 * 60 * 60 * 24))

          this.botbase.sendMessage(msg.chat.id, `The next deadline is on ${deadline} --- ${diffDays} days left\nTasks left to do: `, { noInsulto: true })

          this.getSubjectsByDeadline(deadline, item).then(subjects => {
            for (var i = 0; i < subjects.length; i++) {
              var modules = 0
              var tasks = 0

              for (var j = 0; j < subjects[i].children.length; j++) {
                var modtask = 0
                for (var k = 0; k < subjects[i].children[j].items.length; k++) {
                  if (subjects[i].children[j].items[k].checked == 0) {
                    modtask++;
                  }
                }
                tasks += modtask
                if (modtask > 0) {
                  modules++
                }
              }
              var percent = this.getSubjectCompletedPercent(subjects[i])
              this.botbase.sendMessage(msg.chat.id, `*${subjects[i].name}*: ${modules} modules left containing ${tasks} tasks (${percent.toFixed(2)}% completed)`, { noInsulto: true, parse_mode: 'Markdown' })
            }
          })

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
          '_id': {
            $in: subjects
          }
        }).
        populate({
          path: 'children',
          populate: {
            path: 'items'
          }
        }).
        exec((err, projects) => {
          resolve(projects)
        })
    })

  }

  getSubjectCompletedPercent(subject) {
    var totalTasks = 0
    var completedTasks = 0
    for (var i = 0; i < subject.children.length; i++) {
      for (var j = 0; j < subject.children[i].items.length; j++) {
        var item = subject.children[i].items[j]
        if (item.checked == 1) {
          completedTasks++
        }
        totalTasks++
      }
    }

    return completedTasks / totalTasks * 100
  }
}

module.exports = SylTodoist