const ActivationModel = require('./ActivationModelService');
const ActivationService = require('./ActivationService');
const EMailAddressActivation = require('./eMailAddress');

module.exports = {
	ActivationModel,
	Activation: ActivationService,
	EMailAddressActivation,
};
