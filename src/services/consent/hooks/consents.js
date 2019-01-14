'use strict';

const globalHooks = require('../../../hooks');
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

const checkExisting = (hook) => {
	return hook.app.service("consents").find({query:{userId:hook.data.userId}})
		.then(consents => {
			if (consents.data.length > 0) {
				// merge existing consent with submitted one, submitted data is primary and overwrites databse
				hook.data = Object.assign(consents.data[0], hook.data);
				return hook.app.service('consents').remove(consents.data[0]._id).then(() => {
					return hook;
				});
			} else {
				return hook;
			}
		}).catch(err => {
			return Promise.reject(err);
		});
};

exports.before = {
	all: [],
	find: [auth.hooks.authenticate('jwt'), globalHooks.ifNotLocal(restrictToUserOrRole), mapInObjectToArray],
	get: [auth.hooks.authenticate('jwt')],
	create: [addDates, checkExisting],
	update: [auth.hooks.authenticate('jwt'), addDates],
	patch: [auth.hooks.authenticate('jwt'), addDates],
	remove: [auth.hooks.authenticate('jwt'),]
};

const userHasOneRole = (user, roles) => {
	if (!(roles instanceof Array)) roles = [roles];
	let value = false;
	user.roles.map(role => {
		if (roles.includes(role.name)) {
			value = true;
		}
	});
	return value;
};

const accessCheck = (consent, app) => {
	let access = true;
	let requiresParentConsent = true;
	let user;
	let patchFirstlogin = false;

	return app.service('users').get((consent.userId), { query: { $populate: 'roles'}})
		.then(response => {
			user = response;
			if (userHasOneRole(user, ["demoTeacher", "demoStudent"])) {
				requiresParentConsent = false;
				patchFirstlogin = true;
				return Promise.resolve();
			}

			if (userHasOneRole(user, ["teacher", "administrator", "expert"])) {
				let userConsent = consent.userConsent || {};
				requiresParentConsent = false;
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent &&
					userConsent.thirdPartyConsent && userConsent.researchConsent)) 
				{
						access = false;
						return Promise.resolve();
				} else {
					patchFirstlogin = true;
				}
				return Promise.resolve();
			}

			if (!user.birthday) {
				access = false;
				requiresParentConsent = false;
				return Promise.resolve;
			}
			let age = user.age;

			if (age < 18) {
				let parentConsent = (consent.parentConsents||[])[0] || {};
				//check parent consents
				if (!(parentConsent.privacyConsent && parentConsent.termsOfUseConsent &&
					parentConsent.thirdPartyConsent && parentConsent.researchConsent)) {
					access = false;
					return Promise.resolve();
				}
			}
			if (age > 13) {
				//check user consents
				let userConsent = consent.userConsent || {};
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent &&
					userConsent.thirdPartyConsent && userConsent.researchConsent)) {
					access = false;
					if ((user.preferences || {}).firstLogin) {
						return Promise.resolve();
					}
				}
			}
			if (age > 17){
				requiresParentConsent = false;
			}
		})
		.then(() => {
			if (patchFirstlogin == true && !(user.preferences || {}).firstLogin) {
				let updatedPreferences = user.preferences || {};
				updatedPreferences.firstLogin = true;
				return app.service('users').patch(user._id, {preferences: updatedPreferences});
			}
			return;
		}).then(() => {
			if (access && !(user.preferences || {}).firstLogin) {
				access = false;
			}
			return;
		}).then(() => {
			consent.access = access;
			consent.requiresParentConsent = requiresParentConsent;
			return consent;
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
		}).catch(err => {
			return {};
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
