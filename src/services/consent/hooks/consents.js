const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { modifyDataForUserSchema } = require('../utils');

const { CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../../../../config/globals');

// TODO: after hook for get that checks access.
// TODO: rethink security, due to no schoolId we can't restrict anything.

const restrictToUserOrRole = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((res) => {
		let access = false;
		res.data[0].roles.forEach((role) => {
			if (role.name === 'superhero' || role.name === 'teacher' || role.name === 'administrator') {
				access = true;
			}
		});
		if (access) {
			return hook;
		}

		hook.params.query.userId = hook.params.account.userId;
		return hook;
	});
};

const addDates = (hook) => {
	if (hook.data.parentConsents && hook.data.parentConsents.length) {
		const parentConsent = hook.data.parentConsents[0];
		if ('privacyConsent' in parentConsent && !('dateOfPrivacyConsent' in parentConsent)) {
			parentConsent.dateOfPrivacyConsent = Date.now();
		}
		if ('termsOfUseConsent' in parentConsent && !('dateOftermsOfUseConsent' in parentConsent)) {
			parentConsent.dateOfTermsOfUseConsent = Date.now();
		}
	}
	if (hook.data.userConsent) {
		const { userConsent } = hook.data;
		if ('privacyConsent' in userConsent && !('dateOfPrivacyConsent' in userConsent)) {
			userConsent.dateOfPrivacyConsent = Date.now();
		}
		if ('termsOfUseConsent' in userConsent && !('dateOfTermsOfUseConsent' in userConsent)) {
			userConsent.dateOfTermsOfUseConsent = Date.now();
		}
	}
};

/**
 * check if userId is set and set it to an empty $in clause if not
 * if userId.$in is an object convert it to an array
 * @param {*} context
 */
const setUserIdToCorrectForm = (context) => {
	if (!context.params.query) {
		context.params.query = {};
	}
	if (!context.params.query.userId) {
		context.params.query.userId = {};
		context.params.query.userId.$in = [];
	} else if (context.params.query.userId.$in && !Array.isArray(context.params.query.userId.$in)) {
		context.params.query.userId.$in = Object.values(context.params.query.userId.$in);
	}
	return context;
};

const checkExisting = (hook) => hook.app.service('consents').find({ query: { userId: hook.data.userId } })
	.then((consents) => {
		if (consents.data.length > 0) {
			// merge existing consent with submitted one, submitted data is primary and overwrites databse
			hook.data = Object.assign(consents.data[0], hook.data);
			return hook.app.service('consents').remove(consents.data[0]._id).then(() => hook);
		}
		return hook;
	}).catch((err) => Promise.reject(err));

const userHasOneRole = (user, roles) => {
	if (!(roles instanceof Array)) {
		roles = [roles];
	}
	const value = user.roles.some((role) => roles.includes(role.name));
	return value;
};

const accessCheck = (consent, app) => {
	let access = true;
	let requiresParentConsent = true;
	let user;
	let patchFirstlogin = false;

	return app.service('users').get((consent.userId), { query: { $populate: 'roles' } })
		// eslint-disable-next-line consistent-return
		.then((response) => {
			user = response;
			if (userHasOneRole(user, ['demoTeacher', 'demoStudent'])) {
				requiresParentConsent = false;
				patchFirstlogin = true;
				return Promise.resolve();
			}

			if (userHasOneRole(user, ['teacher', 'administrator', 'expert'])) {
				const userConsent = consent.userConsent || {};
				requiresParentConsent = false;
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent)) {
					access = false;
					return Promise.resolve();
				}
				patchFirstlogin = true;

				return Promise.resolve();
			}

			if (!user.birthday) {
				access = false;
				requiresParentConsent = false;
				return Promise.resolve();
			}
			const { age } = user;

			if (age < CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS) {
				const parentConsent = (consent.parentConsents || [])[0] || {};
				// check parent consents
				if (!(parentConsent.privacyConsent && parentConsent.termsOfUseConsent)) {
					access = false;
					return Promise.resolve();
				}
			}
			if (age > 13) {
				// check user consents
				const userConsent = consent.userConsent || {};
				if (!(userConsent.privacyConsent && userConsent.termsOfUseConsent)) {
					access = false;
					if ((user.preferences || {}).firstLogin) {
						return Promise.resolve();
					}
				}
			}
			if (age > 15) {
				requiresParentConsent = false;
			}
		})
		.then(() => {
			if (patchFirstlogin === true && !(user.preferences || {}).firstLogin) {
				const updatedPreferences = user.preferences || {};
				updatedPreferences.firstLogin = true;
				return app.service('users').patch(user._id, { preferences: updatedPreferences });
			}
			return Promise.resolve();
		})
		.then(() => {
			if (access && !(user.preferences || {}).firstLogin) {
				access = false;
			}
		})
		.then(() => {
			consent.access = access;
			consent.requiresParentConsent = requiresParentConsent;
			return consent;
		})
		.catch((err) => Promise.reject(err));
};

const decorateConsent = (hook) => accessCheck(hook.result, hook.app)
	.then((consent) => {
		hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
		hook.result = consent;
	}).then(() => Promise.resolve(hook));

const decorateConsents = (hook) => {
	hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
	const consentPromises = (hook.result.data || [])
		.map((consent) => accessCheck(consent, hook.app)
			.then((result) => result));

	return Promise.all(consentPromises).then((users) => {
		hook.result.data = users;
		return Promise.resolve(hook);
	});
};

// this method is currently duplicated in AdminUsers service
const getConsentStatus = (consent) => {
	const isUserConsent = (c = {}) => {
		const uC = c.userConsent;
		return uC && uC.privacyConsent && uC.termsOfUseConsent;
	};

	const isNOTparentConsent = (c = {}) => {
		const pCs = c.parentConsents || [];
		return pCs.length === 0 || !(pCs.some((pC) => pC.privacyConsent && pC.termsOfUseConsent));
	};

	if (consent.requiresParentConsent) {
		if (isNOTparentConsent(consent)) {
			return 'missing';
		}

		if (isUserConsent(consent)) {
			return 'ok';
		}
		return 'parentsAgreed';
	}

	if (isUserConsent(consent)) {
		return 'ok';
	}

	return 'missing';
};

const addConsentStatus = (hook) => {
	if (hook.result) {
		hook.result.consentStatus = getConsentStatus(hook.result);
	}
};

const addConsentsStatus = (hook) => {
	if (hook.result.data) {
		hook.result.data.forEach((consent) => {
			consent.consentStatus = getConsentStatus(consent);
		});
	}
};

// TODO: remove at next version
const writeConsentToUser = (context) => {
	const { data, app } = context;
	app.service('usersModel').patch(data.userId, modifyDataForUserSchema(data));
};

const patchConsentToUser = async (context) => {
	const { data, app, id } = context;
	const consent = await app.service('consents').get(id);
	app.service('usersModel').patch(consent.userId, modifyDataForUserSchema(data));
};

exports.before = {
	all: [],
	find: [
		authenticate('jwt'),
		globalHooks.ifNotLocal(restrictToUserOrRole),
		setUserIdToCorrectForm,
	],
	get: [authenticate('jwt')],
	create: [addDates, checkExisting, writeConsentToUser],
	update: [authenticate('jwt'), addDates, writeConsentToUser],
	patch: [authenticate('jwt'), addDates, patchConsentToUser],
	remove: [authenticate('jwt')],
};

exports.after = {
	all: [],
	find: [decorateConsents, addConsentsStatus],
	get: [decorateConsent, addConsentStatus],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
