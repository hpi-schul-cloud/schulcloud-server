'use strict';

const service = require('feathers-mongoose');
const {consentModel, consentVersionModel} = require('./model');
const consentHooks = require('./hooks/consents');
const consentVersionHooks = require('./hooks/consentversions');

module.exports = function () {
	const app = this;

	/*Consent Model*/
	app.use('/consents', service({
		Model: consentModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	}));
	const consentService = app.service('/consents');
	consentService.hooks({
		before: consentHooks.before,
		after: consentHooks.after
	});

	/*ConsentVersion Model*/
	app.use('/consentVersions', service({
		Model: consentVersionModel,
		paginate: {
			default: 25,
			max: 100
		},
		lean: true
	}));
	const consentVersionService = app.service('/consentVersions');
	consentVersionService.hooks({
		before: consentVersionHooks.before,
		after: consentVersionHooks.after
	});
};
