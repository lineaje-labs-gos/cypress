if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('tsx/cjs')
}

module.exports = require('./lib')
