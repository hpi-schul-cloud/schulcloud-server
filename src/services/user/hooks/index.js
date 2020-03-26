const { authenticate } = require('@feathersjs/authentication');
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { iff, isProvider } = require('feathers-hooks-common');
const logger = require('../../../logger');
const {
	hasRole,
	hasRoleNoHook,
	hasPermissionNoHook,
	mapPaginationQuery,
	resolveToIds,
	restrictToCurrentSchool,
	permitGroupOperation,
	denyIfNotCurrentSchool,
	computeProperty,
	hasPermission,
} = require('../../../hooks');

const {
	getAge,
} = require('../../../utils');

const constants = require('../../../utils/constants');
const { CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS } = require('../../consent/config');

const { hasEditPermissionForUser } = require('./index.hooks');

/**
 *
 * @param {object} hook - The hook of the server-request, containing req.params.query.roles as role-filter
 * @returns {Promise }
 */
const mapRoleFilterQuery = (hook) => {
	if (hook.params.query.roles) {
		const rolesFilter = hook.params.query.roles;
		hook.params.query.roles = {};
		hook.params.query.roles.$in = rolesFilter;
	}

	return Promise.resolve(hook);
};

const checkUnique = (hook) => {
	const userService = hook.service;
	const { email } = hook.data;
	if (email === undefined) {
		return Promise.reject(new BadRequest('Fehler beim Auslesen der E-Mail-Adresse bei der Nutzererstellung.'));
	}
	return userService.find({ query: { email: email.toLowerCase() } })
		.then((result) => {
			const { length } = result.data;
			if (length === undefined || length >= 2) {
				return Promise.reject(new BadRequest('Fehler beim Prüfen der Datenbankinformationen.'));
			}
			if (length === 0) {
				return Promise.resolve(hook);
			}

			const user = typeof result.data[0] === 'object' ? result.data[0] : {};
			const input = typeof hook.data === 'object' ? hook.data : {};
			const isLoggedIn = ((hook.params || {}).account && hook.params.account.userId);
			// eslint-disable-next-line no-underscore-dangle
			const { asTask } = hook.params._additional || {};

			if (isLoggedIn || asTask === undefined || asTask === 'student') {
				return Promise.reject(new BadRequest(`Die E-Mail Adresse ${email} ist bereits in Verwendung!`));
			} if (asTask === 'parent') {
				userService.update({ _id: user._id }, {
					$set: {
						children: (user.children || []).concat(input.children),
						firstName: input.firstName,
						lastName: input.lastName,
					},
				});
				return Promise.reject(new BadRequest(
					"parentCreatePatch... it's not a bug, it's a feature - and it really is this time!",
					user,
				));
				/* to stop the create process, the message are catch and resolve in regestration hook */
			}

			return Promise.resolve(hook);
		});
};

const checkUniqueAccount = (hook) => {
	const accountService = hook.app.service('/accounts');
	const { email } = hook.data;
	return accountService.find({ query: { username: email.toLowerCase() } })
		.then((result) => {
			if (result.length > 0) {
				return Promise.reject(
					new BadRequest(`Ein Account mit dieser E-Mail Adresse ${email} existiert bereits!`),
				);
			}
			return Promise.resolve(hook);
		});
};

const updateAccountUsername = async (context) => {
	const {
		params: { account },
		data: { email },
		app,
	} = context;
	if (!email) {
		return context;
	}
	if (email && account.systemId) {
		delete context.data.email;
		return context;
	}

	await app.service('/accounts')
		.patch(account._id, { username: email }, { account })
		.catch((err) => {
			throw new BadRequest('Can not update account username.', err);
		});
	return context;
};

const removeStudentFromClasses = (hook) => {
	const classesService = hook.app.service('/classes');
	const userId = hook.id;
	if (userId === undefined) {
		throw new BadRequest(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.',
		);
	}

	const query = { userIds: userId };

	return classesService.find({ query })
		.then((classes) => Promise.all(
			classes.data.map((myClass) => {
				myClass.userIds.splice(myClass.userIds.indexOf(userId), 1);
				return classesService.patch(myClass._id, myClass);
			}),
		).then(() => hook).catch((err) => {
			throw new Forbidden(
				'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.', err,
			);
		}));
};

const removeStudentFromCourses = async (hook) => {
	const coursesService = hook.app.service('/courses');
	const userId = hook.id;
	if (userId === undefined) {
		throw new BadRequest(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.',
		);
	}

	try {
		const usersCourses = await coursesService.find({ query: { userIds: userId } });
		await Promise.all(usersCourses.data.map(
			(course) => hook.app.service('courseModel').patch(course._id, { $pull: { userIds: userId } }),
		));
	} catch (err) {
		throw new Forbidden(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.', err,
		);
	}
};

const sanitizeData = (hook) => {
	if ('email' in hook.data) {
		if (!constants.expressions.email.test(hook.data.email)) {
			return Promise.reject(new BadRequest('Bitte gib eine valide E-Mail Adresse an!'));
		}
	}
	const idRegExp = RegExp('^[0-9a-fA-F]{24}$');
	if ('schoolId' in hook.data) {
		if (!idRegExp.test(hook.data.schoolId)) {
			return Promise.reject(new BadRequest('invalid Id'));
		}
	}
	if ('classId' in hook.data) {
		if (!idRegExp.test(hook.data.classId)) {
			return Promise.reject(new BadRequest('invalid Id'));
		}
	}
	return Promise.resolve(hook);
};

const checkJwt = () => function checkJwtfnc(hook) {
	if (((hook.params || {}).headers || {}).authorization !== undefined) {
		return (authenticate('jwt')).call(this, hook);
	}
	return Promise.resolve(hook);
};

const pinIsVerified = (hook) => {
	if ((hook.params || {}).account && hook.params.account.userId) {
		return (hasPermission(['STUDENT_CREATE', 'TEACHER_CREATE', 'ADMIN_CREATE'])).call(this, hook);
	}
	// eslint-disable-next-line no-underscore-dangle
	const email = (hook.params._additional || {}).parentEmail || hook.data.email;
	return hook.app.service('/registrationPins').find({ query: { email, verified: true } })
		.then((pins) => {
			if (pins.data.length === 1 && pins.data[0].pin) {
				const age = getAge(hook.data.birthday);

				if (!((hook.data.roles || []).includes('student') && age < CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS)) {
					hook.app.service('/registrationPins').remove(pins.data[0]._id);
				}

				return Promise.resolve(hook);
			}
			return Promise.reject(new BadRequest('Der Pin wurde noch nicht bei der Registrierung eingetragen.'));
		});
};

const securePatching = (hook) => Promise.all([
	hasRole(hook, hook.params.account.userId, 'superhero'),
	hasRole(hook, hook.params.account.userId, 'administrator'),
	hasRole(hook, hook.params.account.userId, 'teacher'),
  hasRole(hook, hook.params.account.userId, 'demoStudent'),
	hasRole(hook, hook.params.account.userId, 'demoTeacher'),
	hasRole(hook, hook.id, 'student'),
])
	.then(([isSuperHero, isAdmin, isTeacher, isDemoStudent, isDemoTeacher, targetIsStudent]) => {
		if (isDemoStudent || isDemoTeacher) {
			return Promise.reject(new errors.Forbidden('Diese Funktion ist im Demomodus nicht verfügbar!'));
		}
		if (!isSuperHero) {
			delete hook.data.schoolId;
			delete (hook.data.$push || {}).schoolId;
		}
		if (!(isSuperHero || isAdmin)) {
			delete hook.data.roles;
			delete (hook.data.$push || {}).roles;
		}
		if (hook.params.account.userId.toString() !== hook.id) {
			if (!(isSuperHero || isAdmin || (isTeacher && targetIsStudent))) {
				return Promise.reject(new BadRequest('You have not the permissions to change other users'));
			}
		}
		return Promise.resolve(hook);
	});

/**
 *
 * @param user {object} - the user the display name has to be generated
 * @param app {object} - the global feathers-app
 * @returns {string} - a display name of the given user
 */
const getDisplayName = (user, app) => app.service('/roles').find({
	// load protected roles
	query: {	// TODO: cache these
		name: ['teacher', 'admin'],
	},
}).then((protectedRoles) => {
	const protectedRoleIds = (protectedRoles.data || []).map((role) => role._id);
	const isProtectedUser = protectedRoleIds.find((role) => (user.roles || []).includes(role));

	user.age = getAge(user.birthday);

	if (isProtectedUser) {
		return user.lastName ? user.lastName : user._id;
	}
	return user.lastName ? `${user.firstName} ${user.lastName}` : user._id;
});

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated user
 */
const decorateUser = (hook) => getDisplayName(hook.result, hook.app)
	.then((displayName) => {
		hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
		hook.result.displayName = displayName;
	})
	.then(() => Promise.resolve(hook));

/**
 *
 * @param user {object} - a user
 * @returns {object} - a user with avatar info
 */
const setAvatarData = (user) => {
	if (user.firstName && user.lastName) {
		user.avatarInitials = user.firstName.charAt(0) + user.lastName.charAt(0);
	} else {
		user.avatarInitials = '?';
	}
	// css readable value like "#ff0000" needed
	const colors = ['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'];
	if (user.customAvatarBackgroundColor) {
		user.avatarBackgroundColor = user.customAvatarBackgroundColor;
	} else {
		// choose colors based on initials
		const index = (user.avatarInitials.charCodeAt(0) + user.avatarInitials.charCodeAt(1)) % colors.length;
		user.avatarBackgroundColor = colors[index];
	}
	return user;
};

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated user avatar
 */
const decorateAvatar = (hook) => {
	if (hook.result.total) {
		hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
		(hook.result.data || []).forEach((user) => setAvatarData(user));
	} else {
		// run and find with only one user
		hook.result = setAvatarData(hook.result);
	}

	return Promise.resolve(hook);
};


/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated users
 */
const decorateUsers = (hook) => {
	hook.result = (hook.result.constructor.name === 'model') ? hook.result.toObject() : hook.result;
	const userPromises = (hook.result.data || []).map((user) => getDisplayName(user, hook.app).then((displayName) => {
		user.displayName = displayName;
		return user;
	}));

	return Promise.all(userPromises).then((users) => {
		hook.result.data = users;
		return Promise.resolve(hook);
	});
};

const handleClassId = (hook) => {
	if (!('classId' in hook.data)) {
		return Promise.resolve(hook);
	}
	return hook.app.service('/classes').patch(hook.data.classId, {
		$push: { userIds: hook.result._id },
	}).then((res) => Promise.resolve(hook));
};

const pushRemoveEvent = (hook) => {
	hook.app.emit('users:after:remove', hook);
	return hook;
};

const enforceRoleHierarchyOnDelete = async (hook) => {
	try {
		const userIsSuperhero = await hasRoleNoHook(hook, hook.params.account.userId, 'superhero');
		if (userIsSuperhero) return hook;

		const [targetIsStudent, targetIsTeacher, targetIsAdmin] = await Promise.all([
			hasRoleNoHook(hook, hook.id, 'student'),
			hasRoleNoHook(hook, hook.id, 'teacher'),
			hasRoleNoHook(hook, hook.id, 'administrator'),
		]);
		let permissionChecks = [true];
		if (targetIsStudent) {
			permissionChecks.push(hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_DELETE'));
		}
		if (targetIsTeacher) {
			permissionChecks.push(hasPermissionNoHook(hook, hook.params.account.userId, 'TEACHER_DELETE'));
		}
		if (targetIsAdmin) {
			permissionChecks.push(hasRoleNoHook(hook, hook.params.account.userId, 'superhero'));
		}
		permissionChecks = await Promise.all(permissionChecks);

		if (!permissionChecks.reduce((accumulator, val) => accumulator && val)) {
			throw new Forbidden('you dont have permission to delete this user!', { hook });
		}

		return hook;
	} catch (error) {
		logger.error(error);
		throw new Forbidden('you dont have permission to delete this user!');
	}
};

const User = require('../model');

exports.before = {
	all: [],
	find: [
		mapPaginationQuery.bind(this),
		// resolve ids for role strings (e.g. 'TEACHER')
		resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),
		authenticate('jwt'),
		iff(isProvider('external'), restrictToCurrentSchool),
		mapRoleFilterQuery,
	],
	get: [authenticate('jwt')],
	create: [
		checkJwt(),
		pinIsVerified,
		sanitizeData,
		checkUnique,
		checkUniqueAccount,
		resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
	],
	update: [
		authenticate('jwt'),
		// TODO only local for LDAP
		sanitizeData,
		hasEditPermissionForUser,
		resolveToIds.bind(this, '/roles', 'data.$set.roles', 'name'),
	],
	patch: [
		authenticate('jwt'),
		iff(isProvider('external'), securePatching),
		permitGroupOperation,
		sanitizeData,
		hasEditPermissionForUser,
		resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
		updateAccountUsername,
	],
	remove: [
		authenticate('jwt'),
		iff(isProvider('external'), [restrictToCurrentSchool, enforceRoleHierarchyOnDelete]),
		permitGroupOperation,
	],
};

exports.after = {
	all: [],
	find: [
		decorateAvatar,
		decorateUsers,
	],
	get: [
		decorateAvatar,
		decorateUser,
		computeProperty(User.userModel, 'getPermissions', 'permissions'),
		iff(isProvider('external'),
			denyIfNotCurrentSchool({
				errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!',
			})),
	],
	create: [
		handleClassId,
	],
	update: [],
	patch: [],
	remove: [
		pushRemoveEvent,
		removeStudentFromClasses,
		removeStudentFromCourses,
	],
};
