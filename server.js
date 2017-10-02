require('dotenv').config();

const app = require('express')(),
      env = process.env.NODE_ENV || 'development',
      config = require('./config/config')[env];

require('./config/express')(app, config);
require('./config/mongoose')(config);
require('./config/routes');

app.listen(config.port);
console.log('Parol Lakay is up and running.');