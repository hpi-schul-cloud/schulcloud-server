'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const addDates = (hook) => {
	if (hook.data.parentConsents) {
		let parentConsent = hook.data.parentConsents[0];
		if ("privacyConsent" in parentConsent) {
			parentConsent.dateOfPrivacyConsent = Date.now();
		}
		if ("researchConsent" in parentConsent) {
			parentConsent.dateOfResearchConsent = Date.now();
		}
		if ("termsOfUseConsent" in parentConsent) {
			parentConsent.dateOfTermsOfUseConsent = Date.now();
		}
		if ("thirdPartyConsent" in parentConsent) {
			parentConsent.dateOfThirdPartyConsent = Date.now();
		}
	}
	if (hook.data.userConsent) {
		let userConsent = hook.data.userConsent;
		if ("privacyConsent" in userConsent) {
			userConsent.dateOfPrivacyConsent = Date.now();
		}
		if ("researchConsent" in userConsent) {
			userConsent.dateOfResearchConsent = Date.now();
		}
		if ("termsOfUseConsent" in userConsent) {
			userConsent.dateOfTermsOfUseConsent = Date.now();
		}
		if ("thirdPartyConsent" in userConsent) {
			userConsent.dateOfThirdPartyConsent = Date.now();
		}
	}
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [addDates],
	update: [addDates],
	patch: [addDates],
	remove: []
};

const accessCheck = (hook) => {
	let access = true;
	let data = hook.result.data || hook.result;
    data = (Array.isArray(data))?(data):([data]);

	return hook.app.service('users').get(data[0].userId)
		.then(user => {
			if (!user.birthday) {
				access = false;
				return Promise.resolve;
			}
			let age = user.age;

			if (age < 18) {
				let parentConsent = data[0].parentConsents[0];
				//check parent consents
				if (!(parentConsent.privacyConsent && parentConsent.termsOfUseConsent &&
					parentConsent.thirdPartyConsent && parentConsent.researchConsent)) {
						access = false;
						return Promise.resolve();
					}
			}
			if (age > 13) {
				//check user consents
				let userConsent = data[0].userConsent;
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent &&
					userConsent.thirdPartyConsent && userConsent.userConsent)) {
						access = false;
						return Promise.resolve();
					}
			}

		})
		.then(() => {
            (hook.result.data)?(hook.result.data[0].access = access):(hook.result.access = access);
            return Promise.resolve(hook);
		})
		.catch(err => {return Promise.reject(err);});

};

exports.after = {
	all: [],
	find: [accessCheck],
	get: [accessCheck],
	create: [],
	update: [],
	patch: [],
	remove: []
};
