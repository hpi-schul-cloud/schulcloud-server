const {
	ActivationModel,
	Activation,
	EMailAddressActivation,
} = require('./services');

const { KEYWORDS } = require('./utils/customUtils');

module.exports = (app) => {
	app.use('activationModel', ActivationModel.activationModelService);
	app.service('activationModel').hooks(ActivationModel.activationModelHooks);

	/** This service does all general things like finding open jobs,
	 * redeeming activation codes, deleting jobs. But this service
	 * does not deal with what should happen when the activation
	 * code is redeemed, e.g. changing the email/user name.
	 */
	const ActivationServiceRoute = '/activation';
	app.use(ActivationServiceRoute, new Activation.Service());
	const ActivationService = app.service(ActivationServiceRoute);
	ActivationService.hooks(Activation.Hooks);

	/** This service takes care of what should happen when an activation
	 * code is redeemed, with the keyword eMailAdress. In addition,
	 * this service can be used to create an job to change the email/username.
	 */
	const EMailAddressActivationRoute = `/activation/${KEYWORDS.E_MAIL_ADDRESS}`;
	app.use(EMailAddressActivationRoute, new EMailAddressActivation.Service());
	const EMailAddressActivationService = app.service(EMailAddressActivationRoute);
	EMailAddressActivationService.hooks(EMailAddressActivation.Hooks);
};
