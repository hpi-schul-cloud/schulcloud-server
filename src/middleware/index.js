const notFound = require('./not-found-handler');
const addLogger = require('./logger');

module.exports = function (app) {
	// Add your custom middleware here. Remember, that
	// just like Express the order matters, so error
	// handling middleware should go last.

	app.configure(addLogger); 
	app.use(notFound()); // @deprecated?
};
