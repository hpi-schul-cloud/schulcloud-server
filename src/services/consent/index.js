const service = require('feathers-mongoose');
const { consentModel, ConsentVersionModel } = require('./model');
const consentHooks = require('./hooks/consents');
const consentVersionHooks = require('./hooks/consentversions');
const consentDocs = require('./docs');
const { ConsentStatusService } = require('./consentStatus.service');
// const depricated = require('./consent.depricated');

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

	// REPLACEMENT FOR CURRENT consent ROUTE
	// app.use('/consents', new deprecated.ConsentService());
	// app.service('consents').hooks(depircated.consentHooks);

	app.use('/consents', consentModelService);
	app.service('/consents').hooks(consentHooks);

	// app.use('/consents/:type/users', new ConsentStatusService());

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
