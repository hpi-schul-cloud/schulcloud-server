const serviceLayer = require('./services');
const setupUserFacade = require('./uc/users.facade');
const setupRepos = require('./repo');

module.exports = (app) => {
	app.configure(serviceLayer);
	setupRepos(app);
	setupUserFacade(app);
};
