const service = require('feathers-mongoose');
const { consentModel, ConsentVersionModel } = require('./model');
const consentHooks = require('./hooks/consents');
const consentVersionHooks = require('./hooks/consentversions');

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	/* Consent Model */
	app.use('/consents', service({
		Model: consentModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	}));
	const consentService = app.service('/consents');
	consentService.hooks(consentHooks);

	/* ConsentVersion Model */
	app.use('/consentVersions', service({
		Model: ConsentVersionModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	}));
	const consentVersionService = app.service('/consentVersions');
	consentVersionService.hooks(consentVersionHooks);
};
