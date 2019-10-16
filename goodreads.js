const goodreads = require('goodreads-api-node');
const myCredentials = {
  key: '6YHn27A8YWetke58jdgQHw',
  secret: 'AwvwbzYia7Ub2Qdl3xAwrakcWZnCxRscaqvEtHvQWU'
};
const gr = goodreads(myCredentials);
module.exports = {gr}