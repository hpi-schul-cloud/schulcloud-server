'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};

const redirectDic = {
	u14: '/firstLogin/U14/',
	u18: '/firstLogin/14_17/',
	ue18: '/firstLogin/UE18/',
	normal: '/dashboard/',
	err: '/consentError'
};

const accessCheck = (hook) => {
	let access = true;
	let redirect = redirectDic['ue18'];
	let data = hook.result.data || hook.result;
    data = (Array.isArray(data))?(data):([data]);

	return hook.app.service('users').get(data[0].userId)
		.then(user => {
			if (!user.birthday) {
				access = false;
				redirect = redirectDic['err'];
				return Promise.resolve;
			}
			let age = user.age;

			if (age < 18) {
				redirect = redirectDic['u14'];
				let parentConsent = data[0].parentConsents[0] || {};
				//check parent consents
				if (!(parentConsent.privacyConsent && parentConsent.termsOfUseConsent &&
					parentConsent.thirdPartyConsent && parentConsent.researchConsent)) {
						access = false;
						redirect = redirectDic['err'];
						return Promise.resolve();
					}
			}
			if (age > 13) {
				redirect = redirectDic['u18'];
				//check user consents
				let userConsent = data[0].userConsent || {};
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent &&
					userConsent.thirdPartyConsent && userConsent.researchConsent)) {
						access = false;
						redirect = redirectDic['err'];
						return Promise.resolve();
					}
			}
			if (age > 17)
				redirect = redirectDic['ue18'];
			if ((user.preferences || {}).firstLogin)
				redirect = redirectDic['normal'];
		})
		.then(() => {
            (hook.result.data) ? (hook.result.data[0].access = access, hook.result.data[0].redirect = redirect) : (hook.result.access = access, hook.result.redirect = redirect);
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
