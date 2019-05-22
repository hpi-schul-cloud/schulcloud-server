const auth = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const bcrypt = require('bcryptjs');
const hooks = require('feathers-hooks-common');
const { ObjectId } = require('mongoose').Types;

const globalHooks = require('../../../hooks');

const MoodleLoginStrategy = require('../strategies/moodle');
const ITSLearningLoginStrategy = require('../strategies/itslearning');
const IServLoginStrategy = require('../strategies/iserv');
const LocalLoginStrategy = require('../strategies/local');
const LdapLoginStrategy = require('../strategies/ldap');

// don't initialize strategies here - otherwise massive overhead
// TODO: initialize all strategies here once
const strategies = {
	moodle: MoodleLoginStrategy,
	itslearning: ITSLearningLoginStrategy,
	iserv: IServLoginStrategy,
	local: LocalLoginStrategy,
	ldap: LdapLoginStrategy,
};

const sanitizeUsername = (hook) => {
	if (hook.data && hook.data.username && !hook.data.systemId) {
		hook.data.username = hook.data.username.trim().toLowerCase();
	}
	return hook;
};

// This is only for SSO
const validateCredentials = (hook) => {
	const {
		username, password, systemId, schoolId,
	} = hook.data;

	if (!username) throw new BadRequest('no username specified');
	if (!password) throw new BadRequest('no password specified');

	if (!systemId) return hook;

	const { app } = hook;
	const systemService = app.service('/systems');
	return systemService.get(systemId)
		.then((system) => {
			const Strategy = strategies[system.type];
			return {
				strategy: new Strategy(app),
				system,
			};
		})
		.then(({ strategy, system }) => strategy.login({ username, password }, system, schoolId))
		.then((client) => {
			if (client.token) {
				hook.data.token = client.token;
			}
			return hook;
		});
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
		globalHooks.hasRole(hook, hook.params.account.userId, 'superhero')])
		.then(([hasStudentCreate, isStudent, hasAdminView, isTeacher, isSuperHero]) => {
			const editsOwnAccount = (hook.params.account._id || {}).toString() === hook.id;
			if (
				(hasStudentCreate && isStudent)
				|| (hasAdminView && (isStudent || isTeacher))
				|| isSuperHero
				|| editsOwnAccount) {
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
			const filtered = result.filter(a => a.systemId === systemId);
			if (filtered.length > 0) {
				return Promise.reject(new BadRequest('Der Benutzername ist bereits vergeben!'));
			}
			return Promise.resolve(hook);
		});
};

const removePassword = (hook) => {
	const { strategy } = hook.data;
	if (strategy === 'ldap') {
		hook.data.password = '';
	}
	return Promise.resolve(hook);
};

const NotAllowed = new BadRequest('Not allowed');
const restrictAccess = (context) => {
	// todo: if superhero pass it
	const { username, userId } = context.params.query;
	if (!userId && !username) {
		throw NotAllowed;
	}
	const query = {};
	if (userId) {
		if (!ObjectId.isValid(userId)) {
			throw NotAllowed;
		}
		query.userId = userId;
	}
	if (username) {
		if (typeof username !== 'string') {
			throw NotAllowed;
		}
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
			const filtered = result.filter(a => a.systemId === systemId);
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

const securePatching = hook => Promise.all([
	globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'administrator'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'teacher'),
	globalHooks.hasRoleNoHook(hook, hook.id, 'student', true),
]).then(([isSuperHero, isAdmin, isTeacher, targetIsStudent]) => {
	const editsOwnAccount = (hook.params.account._id || {}).toString() === hook.id;
	if (hook.params.account._id !== hook.id) {
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
const filterToRelated = (keys) => {
	return globalHooks.ifNotLocal((hook) => {
		const newResult = {};
		keys.forEach((key) => {
			if (hook.result[key] !== undefined) {
				newResult[key] = hook.result[key];
			}
		});
		hook.result = newResult;
		return hook;
	});
};

exports.before = {
	// find, get and create cannot be protected by auth.hooks.authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [restrictAccess],
	get: [hooks.disallow('external')],
	create: [
		sanitizeUsername,
		checkExistence,
		validateCredentials,
		trimPassword,
		local.hooks.hashPassword({ passwordField: 'password' }),
		checkUnique,
		removePassword,
	],
	update: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('ACCOUNT_EDIT'),
		sanitizeUsername,
	],
	patch: [
		auth.hooks.authenticate('jwt'),
		sanitizeUsername,
		globalHooks.ifNotLocal(securePatching),
		protectUserId,
		globalHooks.permitGroupOperation,
		trimPassword,
		validatePassword,
		local.hooks.hashPassword({ passwordField: 'password' }),
	],
	remove: [
		auth.hooks.authenticate('jwt'),
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
