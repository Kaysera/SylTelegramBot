const mongoose = require('mongoose')
const GoodreadsTokenSchema = {
    chatID: String,
    accessToken: String,
    accessSecret: String,
    goodreadsID: String,
    currentlyReadingBook: String,
}

var GoodreadsTokenModel = mongoose.model('GoodreadsToken', GoodreadsTokenSchema)

module.exports = {GoodreadsTokenModel}