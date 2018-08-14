'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

//TODO: after hook for get that checks access.
//TODO: rethink security, due to no schoolId we can't restrict anything.

const restrictToUserOrRole = (hook) => {
	let userService = hook.app.service("users");
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles'
		}
	}).then(res => {
		let access = false;
		res.data[0].roles.map(role => {
			if (role.name === 'superhero' || role.name === 'teacher' || role.name === 'administrator')
				access = true;
		});
		if (access)
			return hook;
		else
			hook.params.query.userId = hook.params.account.userId;

		return hook;
	});
};

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

const mapInObjectToArray = (hook) => {
	if(((hook.params.query||{}).userId||{})["$in"] && !Array.isArray(((hook.params.query||{}).userId||{})["$in"])){
		hook.params.query.userId["$in"] = Object.values(hook.params.query.userId["$in"]);
	}
	return hook;
};


exports.before = {
	all: [],
	find: [auth.hooks.authenticate('jwt'), globalHooks.ifNotLocal(restrictToUserOrRole), mapInObjectToArray],
	get: [auth.hooks.authenticate('jwt')],
	create: [addDates],
	update: [auth.hooks.authenticate('jwt'), addDates],
	patch: [auth.hooks.authenticate('jwt'), addDates],
	remove: [auth.hooks.authenticate('jwt'),]
};

const redirectDic = {
	u14: '/firstLogin/U14/',
	u18: '/firstLogin/14_17/',
	ue18: '/firstLogin/UE18/',
	existing: '/firstLogin/existing/',
	existingGeb: '/firstLogin/existingGeb14',
	normal: '/dashboard/',
	err: '/consentError'
};

const accessCheck = (consent, app) => {
	let access = true;
	let redirect = redirectDic['ue18'];
	let requiresParentConsent = true;

	return app.service('users').get(consent.userId)
		.then(user => {
			if (!user.birthday) {
				access = false;
				requiresParentConsent = false;
				redirect = redirectDic['existing'];
				return Promise.resolve;
			}
			let age = user.age;

			if (age < 18) {
				redirect = redirectDic['u14'];
				let parentConsent = consent.parentConsents[0] || {};
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
				let userConsent = consent.userConsent || {};
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent &&
					userConsent.thirdPartyConsent && userConsent.researchConsent)) {
					access = false;
					if ((user.preferences || {}).firstLogin) {
						redirect = redirectDic['existingGeb'];
						return Promise.resolve();
					}
				}
			}
			if (age > 17){
				redirect = redirectDic['ue18'];
				requiresParentConsent = false;
			}
			if ((user.preferences || {}).firstLogin){
				redirect = redirectDic['normal'];
			}
		})
		.then(() => {
			consent.access = access;
			consent.redirect = redirect;
			consent.requiresParentConsent = requiresParentConsent;
			return Promise.resolve(consent);
		})
		.catch(err => {
			return Promise.reject(err);
		});

};

const decorateConsent = (hook) => {
	return accessCheck(hook.result, hook.app)
		.then(consent => {
			hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
			hook.result = consent;
		})
	.then(() => Promise.resolve(hook));
};

const decorateConsents = (hook) => {
	hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
	const consentPromises = (hook.result.data || []).map(consent => {
		return accessCheck(consent, hook.app).then(result => {
			return result;
		});
	});

	return Promise.all(consentPromises).then(users => {
		hook.result.data = users;
		return Promise.resolve(hook);
	});
};

exports.after = {
	all: [],
	find: [decorateConsents],
	get: [decorateConsent],
	create: [],
	update: [],
	patch: [],
	remove: []
};
