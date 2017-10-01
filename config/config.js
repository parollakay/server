const path = require('path'),
      rootPath = path.normalize(__dirname + '/../../');

module.exports = {
  development: {
    db: process.env.DATABASE_CONNECTION,
    rootPath,
    port: process.env.PORT || 1804,
    secret: process.env.SECRET
  },
  production: {
    db: process.env.DATABASE_CONNECTION,
    rootPath,
    port: process.env.PORT || 80,
    secret: process.env.SECRET
  }
}