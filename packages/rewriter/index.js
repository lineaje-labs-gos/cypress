if (process.env.CYPRESS_ENV !== 'production') {
  require('tsx/cjs')
}

module.exports = require('./lib')
