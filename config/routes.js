module.exports = (app) => {
  const undefinedRoute = (req,res) => res.json({ test: 'You have reached the home of the API. This route is undefined'});
  app.use('/users', require('../api/users'));
  app.use('/terms', require('../api/terms'));
  app.use('/utils', require('../api/utils/util-router'));
  app.use('*', undefinedRoute);
}