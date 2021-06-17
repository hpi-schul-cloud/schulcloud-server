const messengerFacade = require('./uc/messenger.facade');

module.exports = (app) => {
	app.configure(messengerFacade);
};
