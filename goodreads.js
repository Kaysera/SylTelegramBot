const goodreads = require('goodreads-api-node');

const myCredentials = {
  key: process.env.GR_KEY,
  secret: process.env.GR_SECRET
};

const gr = goodreads(myCredentials);
module.exports = {gr}