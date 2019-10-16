const goodreads = require('goodreads-api-node');
const myCredentials = {

};
const gr = goodreads(myCredentials);
module.exports = {gr}