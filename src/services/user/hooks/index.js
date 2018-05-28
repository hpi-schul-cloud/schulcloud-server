'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const asyncLock = require('async-lock');

/**
 *
 * @param {object} hook - The hook of the server-request, containing req.params.query.roles as role-filter
 * @returns {Promise }
 */
const mapRoleFilterQuery = (hook) => {
	if (hook.params.query.roles) {
		let rolesFilter = hook.params.query.roles;
		hook.params.query.roles = {};
		hook.params.query.roles.$in = rolesFilter;
	}

	return Promise.resolve(hook);
};

const checkUnique = (hook) => {
	let userService = hook.service;
	const {email} = hook.data;
	return userService.find({ query: {email: email}})
		.then(result => {
			if(result.data.length > 0) return Promise.reject(new errors.BadRequest('Die E-Mail Adresse ist bereits in Verwendung!'));
			return Promise.resolve(hook);
		});
};

const checkUniqueAccount = (hook) => {
	let accountService = hook.app.service('/accounts');
	const {email} = hook.data;
	return accountService.find({ query: {username: email}})
		.then(result => {
			if(result.length > 0) return Promise.reject(new errors.BadRequest('Ein Account mit dieser E-Mail Adresse existiert bereits!'));
			return Promise.resolve(hook);
		});
};

const classCreationLock = new asyncLock();

/**
 * handleClassNames 
 * this function looks up classes given by name and creates the class if needed
 * it will also add the user to this class
 * @param hook - contains and request body
 */
const handleClassNames = (hook) => {
	let requestBody = hook.data;
	let classService = hook.app.service('/classes');
    if(hook.data.className){
		classCreationLock.acquire(hook.data.className, function(){
			return classService.find({ query: {name: hook.data.className}})
			.then(result => {
				if (result.total == 0) {
					return classService.create({
						name: hook.data.className, 
						schoolId: hook.data.schoolId, 
						teacherIds: [], 
						userIds: []
					});
				} else {
					return Promise.resolve(result.data[0]);
				}
			});
		}) 
			.then(result => {
				return classService.patch(result._id, {$push: {userIds: hook.result.id}});
			});
	}
};

exports.before = function(app) {
	return {
		all: [],
		find: [
			globalHooks.mapPaginationQuery.bind(this),
			globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),	// resolve ids for role strings (e.g. 'TEACHER')
			auth.hooks.authenticate('jwt'),
			globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
			mapRoleFilterQuery
		],
		get: [auth.hooks.authenticate('jwt')],
		create: [
			checkUnique,
			checkUniqueAccount,
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [
			auth.hooks.authenticate('jwt'),
			globalHooks.hasPermission('USER_EDIT'),
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		patch: [
			auth.hooks.authenticate('jwt'),
			globalHooks.hasPermission('USER_EDIT'),
      globalHooks.permitGroupOperation,
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('USER_CREATE'), globalHooks.permitGroupOperation]
	};
};

/**
 *
 * @param user {object} - the user the display name has to be generated
 * @param app {object} - the global feathers-app
 * @returns {string} - a display name of the given user
 */
const getDisplayName = (user, app) => {
	// load protected roles
	return app.service('/roles').find({query:{	// TODO: cache these
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

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated user
 */
const decorateUser = (hook) => {
	return getDisplayName(hook.result, hook.app)
		.then(displayName => {
			hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
			hook.result.displayName = displayName;
		})
		.then(() => Promise.resolve(hook));
};

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated users
 */
const decorateUsers = (hook) => {
	hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
	const userPromises = (hook.result.data || []).map(user => {
		return getDisplayName(user, hook.app).then(displayName => {
			user.displayName = displayName;
			return user;
		});
	});

	return Promise.all(userPromises).then(users => {
		hook.result.data = users;
		return Promise.resolve(hook);
	});
};

const User = require('../model');

exports.after = {
	all: [],
	find: [decorateUsers],
	get: [
		decorateUser,
		globalHooks.computeProperty(User, 'getPermissions', 'permissions'),
		globalHooks.ifNotLocal(globalHooks.denyIfNotCurrentSchool({errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!'}))
	],
	create: [handleClassNames],
	update: [],
	patch: [],
	remove: []
};
