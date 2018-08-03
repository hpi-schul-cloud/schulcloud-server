'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');

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

const schoolIdFromClassId = (hook) => {
	if (!("schoolId" in hook.data) && "classId" in hook.data) {
		return hook.app.service('/classes').get(hook.data.classId)
			.then(res => {
				hook.data.schoolId = res.schoolId;
				return Promise.resolve(hook);
			});
	} else {
		return Promise.resolve(hook);
	}
}

const sanitizeData = (hook) => {
	if ("email" in hook.data) {
		var regex = RegExp("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$");
		if (!regex.test(hook.data.email)) {
			return Promise.reject(new errors.BadRequest('Bitte gib eine valide E-Mail Adresse an!'));
		}
	}
	return Promise.resolve(hook);
}

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
			schoolIdFromClassId,
			sanitizeData,
			checkUnique,
			checkUniqueAccount,
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [
			auth.hooks.authenticate('jwt'),
			globalHooks.hasPermission('USER_EDIT'),
			sanitizeData,
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		patch: [
			auth.hooks.authenticate('jwt'),
			globalHooks.hasPermission('USER_EDIT'),
			globalHooks.permitGroupOperation,
			sanitizeData,
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

		user.age = getAge(user.birthday);

		if(isProtectedUser) {
			return user.lastName ? user.lastName : user._id;
		} else {
			return user.lastName ? `${user.firstName} ${user.lastName}` : user._id;
		}
	});
};

const getAge = (dateString) => {
	const today = new Date();
	const birthDate = new Date(dateString);
	let age = today.getFullYear() - birthDate.getFullYear();
	let m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return age;
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

const handleClassId = (hook) => {
	if (!"classId" in hook.data) {
		return Promise.resolve(hook);
	} else {
	hook.app.service('/classes').patch(hook.data.classId, {
		$push: {userIds: hook.result._id}
	}).then(res => {
		return Promise.resolve(hook);
	});};
}

const User = require('../model');

exports.after = {
	all: [],
	find: [decorateUsers],
	get: [
		decorateUser,
		globalHooks.computeProperty(User.userModel, 'getPermissions', 'permissions'),
		globalHooks.ifNotLocal(globalHooks.denyIfNotCurrentSchool({errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!'}))
	],
	create: [handleClassId],
	update: [],
	patch: [],
	remove: []
};
