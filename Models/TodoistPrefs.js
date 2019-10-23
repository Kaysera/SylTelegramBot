const mongoose = require('mongoose')

const TodoistPrefsSchema = {
    chatID: String,
    sync_token: String,
    daily_message: String,
}

const TodoistPrefsModel = mongoose.model('TodoistPrefs', TodoistPrefsSchema)

module.exports = {TodoistPrefsModel}