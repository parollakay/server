const achievements = require('./achievements');

module.exports = {
  achievements: (req, res) => res.json(achievements.data),
}