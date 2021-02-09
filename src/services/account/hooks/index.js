const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongoose').Types;
const { Forbidden, BadRequest, NotFound } = require('../../../errors');
const { checkPasswordStrength } = require('../../../utils/passwordHelpers');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const constants = require('../../../utils/constants');

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
	const { username, password, systemId } = hook.data;

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
	return Promise.reject(new Error());
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
	const patternResult = checkPasswordStrength(password);

	// only check result if also a password was really given
	if (!patternResult && password) {
		throw new BadRequest('Dein Passwort stimmt mit dem Pattern nicht überein.');
	}

	// in case sso created account skip
	if (!hook.params.account.userId) {
		return hook;
	}

	return Promise.all([
		globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_EDIT'),
		globalHooks.hasRoleNoHook(hook, hook.id, 'student', true),
		globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'ADMIN_VIEW'),
		globalHooks.hasRoleNoHook(hook, hook.id, 'teacher', true),
		globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
		hook.app.service('users').get(hook.params.account.userId),
	]).then(([hasStudentCreate, isStudent, hasAdminView, isTeacher, isSuperHero, user]) => {
		// Check if it is own account
		const editsOwnAccount = equalIds(hook.id, hook.params.account._id);
		// Check if it is firstLogin
		const userDidFirstLogin = user.preferences && user.preferences.firstLogin;
		const { userForcedToChangePassword } = hook.params;
		if (
			(!userDidFirstLogin && editsOwnAccount) ||
			(!editsOwnAccount &&
				((hasStudentCreate && isStudent) || (hasAdminView && (isStudent || isTeacher)) || isSuperHero)) ||
			userForcedToChangePassword
		) {
			return hook;
		}
		if (password && !passwordVerification) {
			throw new Forbidden(
				`Du darfst das Passwort dieses Nutzers nicht ändern oder die
                    Passwortfelder wurden falsch ausgefüllt.`
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
	if (!username) {
		return Promise.resolve(hook);
	}
	return accountService.find({ query: { username, systemId } }).then((result) => {
		// systemId might be null. In that case, accounts with any systemId will be returned
		const filtered = result.filter((a) => a.systemId === systemId);
		if (filtered.length === 1) {
			const editsOwnAccount = equalIds(hook.id, filtered[0]._id);
			if (editsOwnAccount) {
				return Promise.resolve(hook);
			}
		}
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

const NotAllowed = new BadRequest('Not allowed');
const restrictAccess = async (context) => {
	// superhero can pass it
	const user = (context.params.account || {}).userId;
	let isStudent = false;
	if (user) {
		const { roles } = await context.app.service('users').get(user, {
			query: {
				$populate: { path: 'roles' },
			},
		});

		if (roles.some((role) => role.name === 'superhero')) {
			return context;
		}

		if (roles.some((role) => role.name === 'student')) {
			isStudent = true;
		}
	}

	// other restrict operations
	const { username, userId } = context.params.query || {};
	if (!userId && !username) {
		throw NotAllowed;
	}
	const query = {};
	if (isStudent) {
		query._id = context.params.account._id;
	}
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

	if (!userId && systemId) {
		// for sso accounts
		return Promise.resolve(hook);
	}

	return accountService.find({ query: { userId } }).then((result) => {
		// systemId might be null. In that case, accounts with any systemId will be returned
		const filtered = result.filter((a) => a.systemId === systemId);
		if (filtered.length > 0) return Promise.reject(new BadRequest('Der Account existiert bereits!'));
		return Promise.resolve(hook);
	});
};

const protectUserId = (hook) => {
	const accountService = hook.service;
	if (hook.data.userId) {
		return accountService.get(hook.id).then((res) => {
			if (res.systemId) {
				return Promise.resolve(hook);
			}
			return Promise.reject(new Forbidden('Die userId kann nicht geändert werden.'));
		});
	}
	return hook;
};

const securePatching = (hook) =>
	Promise.all([
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
const filterToRelated = (keys) =>
	globalHooks.ifNotLocal((hook) => {
		const newResult = {};
		keys.forEach((key) => {
			if (hook.result[key] !== undefined) {
				newResult[key] = hook.result[key];
			}
		});
		hook.result = newResult;
		return hook;
	});

const restrictToUsersSchool = async (context) => {
	const userIsSuperhero = await globalHooks.hasRoleNoHook(context, context.params.account.userId, 'superhero');
	if (userIsSuperhero) return context;
	const userService = context.app.service('users');
	const { schoolId: usersSchoolId } = await userService.get(context.params.account.userId);

	const targetAccount = await context.app.service('accountModel').get(context.id);
	const { schoolId: targetSchoolId } = await userService.get(targetAccount.userId);
	if (!equalIds(usersSchoolId, targetSchoolId)) {
		throw new NotFound('this account doesnt exist');
	}
	return context;
};

const validateUserName = async (context) => {
	const accountService = context.app.service('accounts');
	const { systemId } = context.method === 'create' ? context.data : await accountService.get(context.id);
	if (systemId) {
		return context;
	}
	if (context.data && context.data.username && !constants.expressions.email.test(context.data.username)) {
		throw new BadRequest('Invalid username. Username should be a valid email format');
	}
	return context;
};

const restrictToSameSchool = async (context) => {
	const { query } = context.params;
	const userIsSuperhero = await globalHooks.hasRoleNoHook(context, context.params.account.userId, 'superhero');
	if (userIsSuperhero) return context;

	if (query.userId) {
		const { schoolId: currentUserSchoolId } = await globalHooks.getUser(context);
		const { schoolId: requestedUserSchoolId } = await context.app.service('users').get(query.userId);

		if (!equalIds(currentUserSchoolId, requestedUserSchoolId)) {
			throw new Forbidden('You are not allowed to request this information');
		}

		return context;
	}

	throw new BadRequest('The request query should include a valid userId');
};

module.exports = {
	sanitizeUsername,
	validateUserName,
	validateCredentials,
	trimPassword,
	validatePassword,
	checkUnique,
	removePassword,
	restrictAccess,
	checkExistence,
	protectUserId,
	securePatching,
	filterToRelated,
	restrictToUsersSchool,
	restrictToSameSchool,
};
