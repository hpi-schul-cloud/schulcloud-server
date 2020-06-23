const ActivationModel = require('./ActivationModelService');
const ActivationService = require('./ActivationService');
const EMailAdresseActivation = require('./eMailAddress');

module.exports = {
	ActivationModel,
	Activation: ActivationService,
	EMailAdresseActivation,
};
