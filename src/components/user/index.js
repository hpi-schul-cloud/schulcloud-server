const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const serviceLayer = require('./services');
const setupUserFacade = require('./uc/users.facade');
const setupRegistrationPinFacade = require('./uc/registrationPin.facade');

const { registerApiValidation } = require('../../utils/apiValidation');

module.exports = (app) => {
	registerApiValidation(app, path.join(__dirname, '/docs/openapi.yaml'));
	app.use('/users/v2/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.configure(serviceLayer);
	setupUserFacade(app);
	setupRegistrationPinFacade(app);
};
