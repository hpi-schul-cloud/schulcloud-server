const {
	ActivationModel,
	EMailAdresseActivation,
} = require('./services');

module.exports = (app) => {
	app.use('activationModel', ActivationModel.activationModelService);
	app.service('activationModel').hooks(ActivationModel.activationModelHooks);

	const EMailAdresseActivationRoute = '/activation/email';
	app.use(EMailAdresseActivationRoute, new EMailAdresseActivation.Service());
	const EMailAdresseActivationService = app.service(EMailAdresseActivationRoute);
	EMailAdresseActivationService.hooks(EMailAdresseActivation.Hooks);
};
