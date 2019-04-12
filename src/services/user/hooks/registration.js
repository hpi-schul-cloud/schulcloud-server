const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

const mailToLowerCase = (hook) => {
	if (hook.data) {
		if (hook.data.email) {
			hook.data.email = hook.data.email.toLowerCase();
		}
		if (hook.data.parent_email) {
			hook.data.parent_email = hook.data.parent_email.toLowerCase();
		}
		if (hook.data.student_email) {
			hook.data.student_email = hook.data.student_email.toLowerCase();
		}
	}
	return Promise.resolve(hook);
};

exports.before = {
	all: [],
	find: [],
	get: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_VIEW'),
		mailToLowerCase,
	],
	create: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_CREATE'),
		mailToLowerCase,
	],
	update: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_EDIT'),
		mailToLowerCase,
	],
	patch: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_EDIT'),
		mailToLowerCase,
	],
	remove: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_CREATE'),
		mailToLowerCase,
	],
};
