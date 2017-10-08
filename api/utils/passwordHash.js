const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
  hashPass: async (password) => {
    const hash = await bcrypt.hash(password, 11);
    return hash;
  },
  validPass: async (password, hash) => {
    const match = await bcrypt.compare(password, hash);
    console.log(match)
    return match;
  },
  authMiddleWare: (req, res, next) => {
    const message = 'You are not authorized to view this data.';
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) return res.status(403).send({ message });
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) return res.status(403).send({ message });
      req.decoded = decoded;
      next();
    })
  }
}