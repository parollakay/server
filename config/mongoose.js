const mongoose = require('mongoose');

module.exports = (config) => {
  mongoose.connect(config.db, { useMongoClient: true});
  mongoose.Promise = global.Promise;

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, "Parol Lakay could not connect to the database."));
  db.once('open', () => console.log('Database connection established.'));
}