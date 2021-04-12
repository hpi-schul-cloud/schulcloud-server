const ActivationModelService = require('./ActivationModelService');
const ActivationService = require('./ActivationService');
const EMailAddressActivation = require('./eMailAddress');

module.exports = {
	ActivationModelService,
	Activation: ActivationService,
	EMailAddressActivation,
};
