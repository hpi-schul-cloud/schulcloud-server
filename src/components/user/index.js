const serviceLayer = require('./services');
const setupUserFacade = require('./uc/users.facade');

module.exports = (app) => {
	app.configure(serviceLayer);
	setupUserFacade(app);
};
