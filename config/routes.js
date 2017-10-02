
module.exports = (app) => {
  // Do something abt this later.
  const undefinedRoute = (req,res) => res.json({ test: 'You have reached the home of the API. This route is undefined'});
  app.use('/users', (req, res, next) => {
    console.log('posted to users route');
    next();
  }, require('../api/users'));
  app.use('/terms', require('../api/terms'));
  //app.use('*', undefinedRoute);
}