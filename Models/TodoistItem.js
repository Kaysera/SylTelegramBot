const mongoose = require('mongoose')

const TodoistItemSchema = {
    _id: Number, 
    user: Number,
    project: {type: Number, ref: 'TodoistProject'},
    content: String,
    due: String,
    child_order: Number,
    labels: [{type: Number, ref: 'TodoistLabel'}],
    checked: Number
}

const TodoistItemModel = mongoose.model('TodoistItem', TodoistItemSchema)

module.exports = {TodoistItemModel}