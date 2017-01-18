'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const local = require('feathers-authentication-local');

exports.before = function(app) {
	return {
		all: [auth.hooks.authenticate('jwt')],
		find: [
			globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name')
		],
		get: [],
		create: [
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [],
		patch: [],
		remove: []
	};
};

// combine permissions from all groups to an array
const resolvePermissions = (user, app) => {
	const roleService = app.service('/roles');
	return _resolvePermissions(user, {roleService});
};
const _resolvePermissions = (owner, {roleService, processedRoles = []}) => {
	return Promise.all((owner.roles || []).map((roleId) => {
		return roleService.get(roleId).then((role) => {

			// recursion
			if((role.roles || []).length && !processedRoles.includes(roleId)) {
				// prevent circles by remembering processed roles
				processedRoles.push(roleId);

				return _resolvePermissions(role, {roleService, processedRoles}).then((permissions) => {
					return permissions.concat(role.permissions);
				}).catch((err) => {
					throw new Error(err);
				});
			} else {
				return role.permissions;
			}

		});
	})).then((rolePermissions) => {
		let permissions = [];
		rolePermissions.forEach((rolePermission) => {
			permissions = permissions.concat(rolePermission || []);
		});
		return permissions;
	}).catch((err) => {
		throw new Error(err);
	});
};

const getDisplayName = (user, app) => {
	// load protected roles
	return app.service('/roles').find({query:{
		name: ['teacher', 'admin']
	}}).then((protectedRoles) => {
		const protectedRoleIds = (protectedRoles.data || []).map(role => role._id);
		let isProtectedUser = protectedRoleIds.find(role => {
			return (user.roles || []).includes(role);
		});

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
	create: [],
	update: [],
	patch: [],
	remove: []
};
