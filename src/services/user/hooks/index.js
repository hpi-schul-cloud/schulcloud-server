'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const local = require('feathers-authentication-local');

exports.before = function(app) {
	return {
		all: [],
		find: [
			globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name')	// resolve ids for role strings (e.g. 'TEACHER')
		],
		get: [],
		create: [
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [],
		patch: [],
		remove: [auth.hooks.authenticate('jwt')]
	};
};

const getDisplayName = (user, app) => {
	// load protected roles
	return app.service('/roles').find({query:{
		name: ['teacher', 'admin']
	}}).then((protectedRoles) => {
		const protectedRoleIds = (protectedRoles.data || []).map(role => role._id);
		});
		let isProtectedUser = protectedRoleIds.find(role => {
			return (user.roles || []).includes(role);

		if(isProtectedUser) {
			return user.lastName ? user.lastName : user._id;
		} else {
			return user.lastName ? `${user.firstName} ${user.lastName}` : user._id;
		}
	});
};

const decorateUser = (hook) => {
	return new Promise(resolve => {
		// TODO: somehow Promise.all().then() is not working as hook result
		Promise.all([
			getDisplayName(hook.result, hook.app),
			resolvePermissions(hook.result, hook.app)
		]).then(([displayName, permissions]) => {
			hook.result = hook.result.constructor.name === 'model' ? hook.result.toObject() : hook.result;

			hook.result.displayName = displayName;
			hook.result.permissions = permissions;
			resolve(hook);
		});
	});
};

exports.after = {
	all: [],
	find: [decorateUser],
	get: [decorateUser],
const User = require('../model');
	get: [globalHooks.computeProperty(User, 'getPermissions', 'permissions')],
	create: [],
	update: [],
	patch: [],
	remove: []
};
