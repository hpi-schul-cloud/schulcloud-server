const { authenticate } = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const bcrypt = require('bcryptjs');
const hooks = require('feathers-hooks-common');
const { ObjectId } = require('mongoose').Types;
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const globalHooks = require('../../../hooks');

const { LdapStrategy, MoodleStrategy, IservStrategy } = require('../../authentication/strategies');

const strategies = {
	moodle: MoodleStrategy,
	ldap: LdapStrategy,
	iserv: IservStrategy,
};

const sanitizeUsername = (hook) => {
	if (hook.data && hook.data.username && !hook.data.systemId) {
		hook.data.username = hook.data.username.trim().toLowerCase();
	}
	return hook;
};

// This is only for SSO
const validateCredentials = async (hook) => {
	const {
		username, password, systemId, schoolId,
	} = hook.data;

	if (!username) throw new BadRequest('no username specified');
	if (!password) throw new BadRequest('no password specified');

	if (!systemId) return hook;

	const { app } = hook;
	const systemService = app.service('/systems');
	const system = await systemService.get(systemId);

	const Strategy = strategies[system.type];
	const systemStrategy = new Strategy();
	const client = await systemStrategy.credentialCheck(username, password, system);
	if (client) {
		return hook;
	}
	return Promise.reject();
};

const trimPassword = (hook) => {
	if (hook.data.password) {
		hook.data.password = hook.data.password.trim();
	}
	if (hook.data.password_verification) {
		hook.data.password_verification = hook.data.password_verification.trim();
	}

	return hook;
};

const validatePassword = (hook) => {
	const passwordVerification = hook.data.password_verification;
	const { password } = hook.data;

	// Check against Pattern which is also used in Frontend
	const pattern = new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\\-_!<>§$%&\\/()=?\\\\;:,.#+*~\']).{8,255}$');
	const patternResult = pattern.test(password);

	// only check result if also a password was really given
	if (!patternResult && password) {
		throw new BadRequest('Dein Passwort stimmt mit dem Pattern nicht überein.');
	}

	// in case sso created account skip
	if (!hook.params.account.userId) {
		return hook;
	}

	return Promise.all([
		globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_CREATE'),
		globalHooks.hasRoleNoHook(hook, hook.id, 'student', true),
		globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'ADMIN_VIEW'),
		globalHooks.hasRoleNoHook(hook, hook.id, 'teacher', true),
		globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
		hook.app.service('users').get(hook.params.account.userId)])
		.then(([hasStudentCreate, isStudent, hasAdminView, isTeacher, isSuperHero, user]) => {
			// Check if it is own account
			const editsOwnAccount = equalIds(hook.id, hook.params.account._id);
			// Check if it is firstLogin
			const userDidFirstLogin = (user.preferences && user.preferences.firstLogin);

			if (
				(!userDidFirstLogin && editsOwnAccount)
				|| (
					(!editsOwnAccount
						&& (
							(hasStudentCreate && isStudent)
							|| (hasAdminView && (isStudent || isTeacher))
							|| isSuperHero
						)
					)
				)
			) {
				return hook;
			}
			if (password && !passwordVerification) {
				throw new Forbidden(
					`Du darfst das Passwort dieses Nutzers nicht ändern oder die
                    Passwortfelder wurden falsch ausgefüllt.`,
				);
			}

			if (passwordVerification) {
				return new Promise((resolve, reject) => {
					bcrypt.compare(passwordVerification, hook.params.account.password, (err, res) => {
						if (err) {
							reject(new BadRequest('Ups, bcrypt ran into an error.'));
						}
						if (!res) {
							reject(new BadRequest('Dein Passwort ist nicht korrekt!'));
						}
						resolve();
					});
				});
			}
			return hook;
		});
};

const checkUnique = (hook) => {
	const accountService = hook.service;
	const { username, systemId } = hook.data;
	return accountService.find({ query: { username, systemId } })
		.then((result) => {
			// systemId might be null. In that case, accounts with any systemId will be returned
			const filtered = result.filter((a) => a.systemId === systemId);
			if (filtered.length > 0) {
				return Promise.reject(new BadRequest('Der Benutzername ist bereits vergeben!'));
			}
			return Promise.resolve(hook);
		});
};

const removePassword = (hook) => {
	const noPasswordStrategies = ['ldap', 'moodle', 'iserv'];

	const { strategy } = hook.data;
	if (noPasswordStrategies.includes(strategy)) {
		hook.data.password = '';
	}
	return Promise.resolve(hook);
};

const restrictAccess = async (context) => {
	// superhero can pass it
	const user = (context.params.account || {}).userId;
	if (user) {
		const { roles } = await context.app.service('users').get(user, {
			query: {
				$populate: { path: 'roles' },
			},
		});
		if (roles.some((role) => role.name === 'superhero')) {
			return context;
		}
	}

	// other restrict operations
	const { username, userId } = context.params.query || {};
	if (!userId && !username) { throw new BadRequest('Not allowed'); }
	const query = {};
	if (userId) {
		if (!ObjectId.isValid(userId)) { throw new BadRequest('Not allowed'); }
		query.userId = userId;
	}
	if (username) {
		if (typeof username !== 'string') { throw new BadRequest('Not allowed'); }
		query.username = username;
	}
	// @override
	context.params.query = query;
	return context;
};

const checkExistence = (hook) => {
	const accountService = hook.service;
	const { userId, systemId } = hook.data;

	if (!userId && systemId) { // for sso accounts
		return Promise.resolve(hook);
	}

	return accountService.find({ query: { userId } })
		.then((result) => {
			// systemId might be null. In that case, accounts with any systemId will be returned
			const filtered = result.filter((a) => a.systemId === systemId);
			if (filtered.length > 0) return Promise.reject(new BadRequest('Der Account existiert bereits!'));
			return Promise.resolve(hook);
		});
};

const protectUserId = (hook) => {
	const accountService = hook.service;
	if (hook.data.userId) {
		return accountService.get(hook.id)
			.then((res) => {
				if (res.systemId) {
					return Promise.resolve(hook);
				} return Promise.reject(new Forbidden('Die userId kann nicht geändert werden.'));
			});
	}
	return hook;
};

const securePatching = (hook) => Promise.all([
	globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'administrator'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'teacher'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'demoStudent'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'demoTeacher'),
	globalHooks.hasRoleNoHook(hook, hook.id, 'student', true),
]).then(([isSuperHero, isAdmin, isTeacher, isDemoStudent, isDemoTeacher, targetIsStudent]) => {
	const editsOwnAccount = equalIds(hook.id, hook.params.account._id);
	if (hook.params.account._id !== hook.id) {
		if (isDemoStudent || isDemoTeacher) {
			return Promise.reject(new Forbidden('Diese Funktion ist im Demomodus nicht verfügbar!'));
		}
		if (!(isSuperHero || isAdmin || (isTeacher && targetIsStudent) || editsOwnAccount)) {
			return Promise.reject(new BadRequest('You have not the permissions to change other users'));
		}
	}
	return Promise.resolve(hook);
});

/**
 * @method get
 * @param {Array of strings} keys
 * @afterHook
 * @notLocal
 */
const filterToRelated = (keys) => globalHooks.ifNotLocal((hook) => {
	const newResult = {};
	keys.forEach((key) => {
		if (hook.result[key] !== undefined) {
			newResult[key] = hook.result[key];
		}
	});
	hook.result = newResult;
	return hook;
});

const testIfJWTExist = (context) => {
	if ((context.params.headers || {}).authorization) {
		return authenticate('jwt')(context);
	}
	return context;
};

exports.before = {
	// find, get and create cannot be protected by authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [testIfJWTExist, globalHooks.ifNotLocal(restrictAccess)],
	get: [hooks.disallow('external')],
	create: [
		sanitizeUsername,
		checkExistence,
		validateCredentials,
		trimPassword,
		local.hooks.hashPassword('password'),
		checkUnique,
		removePassword,
	],
	update: [
		authenticate('jwt'),
		globalHooks.hasPermission('ACCOUNT_EDIT'),
		globalHooks.restrictToCurrentSchool,
		sanitizeUsername,
	],
	patch: [
		authenticate('jwt'),
		sanitizeUsername,
		globalHooks.ifNotLocal(securePatching),
		protectUserId,
		globalHooks.permitGroupOperation,
		trimPassword,
		globalHooks.ifNotLocal(validatePassword),
		local.hooks.hashPassword('password'),
	],
	remove: [
		authenticate('jwt'),
		globalHooks.hasPermission('ACCOUNT_CREATE'),
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
	all: [local.hooks.protect('password')],
	find: [],
	get: [filterToRelated(['_id', 'username', 'userId', 'systemId'])],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
