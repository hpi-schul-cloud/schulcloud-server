'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = function(app) {
	return {
		all: [],
		find: [
			auth.verifyToken(),
			auth.populateUser(),
			auth.restrictToAuthenticated(),
			globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name')
		],
		get: [
			/*auth.verifyToken(),
			 auth.populateUser(),
			 auth.restrictToAuthenticated()*/
		],
		create: [
			auth.hashPassword(),
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [
			auth.verifyToken(),
			auth.populateUser(),
			auth.restrictToAuthenticated(),
			auth.restrictToOwner({ownerField: '_id'})
		],
		patch: [
			auth.verifyToken(),
			auth.populateUser(),
			auth.restrictToAuthenticated(),
			auth.restrictToOwner({ownerField: '_id'})
		],
		remove: [
			auth.verifyToken(),
			auth.populateUser(),
			auth.restrictToAuthenticated(),
			auth.restrictToOwner({ownerField: '_id'})
		]
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


exports.after = {
	all: [hooks.remove('password')],
	find: [(hook) => {
		hook.result = hook.result.constructor.name === 'model' ? hook.result.toObject() : hook.result;

		return resolvePermissions(hook.result, hook.app).then((permissions) => {
			hook.result.permissions = permissions;
			return hook;
		});
	}],
	get: [
		(hook) => {
			hook.result = hook.result.constructor.name === 'model' ? hook.result.toObject() : hook.result;

			return resolvePermissions(hook.result, hook.app).then((permissions) => {
				hook.result.permissions = permissions;
				return hook;
			});
		}
	],
	create: [],
	update: [],
	patch: [],
	remove: []
};
