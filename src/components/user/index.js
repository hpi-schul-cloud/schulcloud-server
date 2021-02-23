const serviceLayer = require('./services');
const setupUserFacade = require('./uc/users.facade');
const setupRegistrationPinFacade = require('./uc/registrationPin.facade');

module.exports = (app) => {
	app.configure(serviceLayer);
	setupUserFacade(app);
	setupRegistrationPinFacade(app);
};
