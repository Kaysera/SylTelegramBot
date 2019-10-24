const mongoose = require('mongoose')

const TodoistProgressSchema = {
    user: Number, 
    subject: String,
    date: String,
    progress: Number,
}

const TodoistProgressModel = mongoose.model('TodoistProgress', TodoistProgressSchema)

module.exports = {TodoistProgressModel}