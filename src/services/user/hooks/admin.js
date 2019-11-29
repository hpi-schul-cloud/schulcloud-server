const { authenticate } = require('@feathersjs/authentication').hooks;
const { Forbidden } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
// is admin
// restricted to current school

const hasAdminRights = (hook) => Promise.all([
	globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'administrator'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'teacher'),
]).then(([isSuperHero, isAdmin, isTeacher]) => {
	if (!(isSuperHero || isAdmin || isTeacher)) {
		throw new Forbidden();
	}
});

exports.before = {
	all: [authenticate('jwt'), hasAdminRights],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
