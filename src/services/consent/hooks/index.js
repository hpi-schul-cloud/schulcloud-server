'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const addDatesCreate = (hook) => {
	let a = hook;
	if (hook.data.parentConsents) {
		hook.data.parentConsents[0].dateOfPrivacyConsent = Date.now();
		hook.data.parentConsents[0].dateOfResearchConsent = Date.now();
		hook.data.parentConsents[0].dateOfTermsOfUseConsent = Date.now();
		hook.data.parentConsents[0].dateOfThirdPartyConsent = Date.now();
	}
	if (hook.data.userConsent) {
		hook.data.userConsent.dateOfPrivacyConsent = Date.now();
		hook.data.userConsent.dateOfResearchConsent = Date.now();
		hook.data.userConsent.dateOfTermsOfUseConsent = Date.now();
		hook.data.userConsent.dateOfThirdPartyConsent = Date.now();
	}
};

//patch

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [addDatesCreate],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
