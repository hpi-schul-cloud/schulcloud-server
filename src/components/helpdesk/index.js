const helpdeskFacade = require('./uc/helpdesk.facade');

module.exports = (app) => {
	app.configure(helpdeskFacade);
};
