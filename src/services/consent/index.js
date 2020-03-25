const service = require('feathers-mongoose');
const { consentModel, ConsentVersionModel } = require('./model');
const consentHooks = require('./hooks/consents');
const consentVersionHooks = require('./hooks/consentversions');
const consentDocs = require('./docs');
const ConsentService = require('./consent.service');

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	const consentModelService = service({
		Model: consentModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	});
	consentModelService.docs = consentDocs;
	/* Consent Model */
	app.use('/consents/model', consentModelService);


	app.use('/constens', ConsentService);
	app.service('/consents').hooks(consentHooks);

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
