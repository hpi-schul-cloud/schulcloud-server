const {
	ActivationModel,
	Activation,
	EMailAdresseActivation,
} = require('./services');

const { KEYWORDS } = require('./utils/customUtils');

module.exports = (app) => {
	app.use('activationModel', ActivationModel.activationModelService);
	app.service('activationModel').hooks(ActivationModel.activationModelHooks);

	const ActivationServiceRoute = '/activation';
	app.use(ActivationServiceRoute, new Activation.Service());
	const ActivationService = app.service(ActivationServiceRoute);
	ActivationService.hooks(Activation.Hooks);

	const EMailAdresseActivationRoute = `/activation/${KEYWORDS.E_MAIL_ADDRESS}`;
	app.use(EMailAdresseActivationRoute, new EMailAdresseActivation.Service());
	const EMailAdresseActivationService = app.service(EMailAdresseActivationRoute);
	EMailAdresseActivationService.hooks(EMailAdresseActivation.Hooks);
};
