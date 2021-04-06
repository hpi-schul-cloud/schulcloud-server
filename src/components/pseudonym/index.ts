const pseudonymFacade = require('./uc/pseudonym.facade');

module.exports = (app) => {
	app.configure(pseudonymFacade);
};
