const service = require('feathers-mongoose');
const { consentModel, ConsentVersionModel } = require('./model');
const consentHooks = require('./hooks/consents');
const consentVersionModelHooks = require('./hooks/consentversionsModelHooks');
const consentDocs = require('./docs');
// const { ConsentStatusService } = require('./services/consentStatus.service');
const { ConsentCheckService, consentCheckHooks } = require('./services/consentCheck.service');
const { ConsentVersionService, ConsentVersionServiceHooks } = require('./services/consentVersionService');
const deprecated = require('./services/consent.deprecated');

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	/* const consentModelService = service({
		Model: consentModel,
		paginate: {
			default: 25,
			max: 100,
		},
		lean: true,
	});
	consentModelService.docs = consentDocs;
	// Consent Model
*/
	// REPLACEMENT FOR CURRENT consent ROUTE
	app.use('/consents', new deprecated.ConsentService());
	app.service('/consents').hooks(deprecated.consentHooks);
	/*
	app.use('/consents', consentModelService);
	app.service('/consents').hooks(consentHooks);
	*/

	// app.use('/consents/:type/users', new ConsentStatusService());

	/* Check for current Version */
	const checkUrl = '/consents/:userId/check';
	app.use(checkUrl, new ConsentCheckService());
	app.service(checkUrl).hooks(consentCheckHooks);

	/* ConsentVersion Model */
	app.use('consentVersionsModel', service({
		Model: ConsentVersionModel,
		paginate: {
			default: 100,
			max: 200,
		},
		lean: true,
	}));
	app.service('consentVersionsModel').hooks(consentVersionModelHooks);

	app.use('/consentVersions', new ConsentVersionService());
	app.service('/consentVersions').hooks(ConsentVersionServiceHooks);
};
