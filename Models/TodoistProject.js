const mongoose = require('mongoose')

const TodoistProjectSchema = {
    _id: Number, 
    user: Number,
    name: String,
    parent: {type: Number, ref: 'TodoistProject'},
    child_order: Number,
    is_archived: Number,
    children: [{type: Number, ref: 'TodoistProject'}],
    items: [{type: Number, ref: 'TodoistItem'}]
}

const TodoistProjectModel = mongoose.model('TodoistProject', TodoistProjectSchema)

module.exports = {TodoistProjectModel}