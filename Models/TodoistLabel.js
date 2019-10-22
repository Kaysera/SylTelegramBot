const mongoose = require('mongoose')

const TodoistLabelSchema = {
    _id: Number,
    user: Number, 
    name: String
}

const TodoistLabelModel = mongoose.model('TodoistLabel', TodoistLabelSchema)

module.exports = {TodoistLabelModel}