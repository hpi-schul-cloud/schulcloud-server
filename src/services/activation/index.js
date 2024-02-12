const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { ActivationModelService, Activation } = require('./services');

module.exports = (app) => {
	app.use('/activation/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('activationModel', ActivationModelService.activationModelService);
	app.service('activationModel').hooks(ActivationModelService.activationModelHooks);

	/** This service does all general things like finding open jobs,
	 * redeeming activation codes, deleting jobs. But this service
	 * does not deal with what should happen when the activation
	 * code is redeemed, e.g. changing the email/user name.
	 */
	const ActivationServiceRoute = '/activation';
	app.use(ActivationServiceRoute, new Activation.Service());
	const ActivationService = app.service(ActivationServiceRoute);
	ActivationService.hooks(Activation.Hooks);
};
