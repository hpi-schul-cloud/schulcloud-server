const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const logger = require('winston');
const globalHooks = require('../../../hooks');
const { sortRoles } = require('../../role/utils/rolesHelper');

const constants = require('../../../utils/constants');

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
		return Promise.reject(new errors
			.BadRequest('Fehler beim Auslesen der E-Mail-Adresse bei der Nutzererstellung.'));
	}
	return userService.find({ query: { email: email.toLowerCase() } })
		.then((result) => {
			const { length } = result.data;
			if (length === undefined || length >= 2) {
				return Promise.reject(new errors.BadRequest('Fehler beim Prüfen der Datenbankinformationen.'));
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
				return Promise.reject(new errors.BadRequest(`Die E-Mail Adresse ${email} ist bereits in Verwendung!`));
			} if (asTask === 'parent') {
				userService.update({ _id: user._id }, {
					$set: {
						children: (user.children || []).concat(input.children),
						firstName: input.firstName,
						lastName: input.lastName,
					},
				});
				return Promise.reject(new errors
					.BadRequest(
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
				return Promise.reject(new errors
					.BadRequest(`Ein Account mit dieser E-Mail Adresse ${email} existiert bereits!`));
			}
			return Promise.resolve(hook);
		});
};

const updateAccountUsername = (hook) => {
	const accountService = hook.app.service('/accounts');

	accountService.find({ query: { userId: hook.id } })
		.then((result) => {
			if (result.length === 0) {
				return Promise.resolve(hook);
			}
			const account = result[0];
			const accountId = (account._id).toString();
			if (!account.systemId) {
				if (!hook.data.email) {
					return Promise.resolve(hook);
				}
				const { email } = hook.data;
				return accountService.patch(accountId, { username: email }, { account: hook.params.account })
					.then(() => Promise.resolve(hook));
			}
			hook.result = {};
			return Promise.resolve(hook);
		}).catch((error) => {
			logger.log(error);
			return Promise.reject(error);
		});
};

const removeStudentFromClasses = (hook) => {
	const classesService = hook.app.service('/classes');
	const userId = hook.id;
	if (userId === undefined) throw new errors.BadRequest('Fehler beim Entfernen des Users aus abhängigen Klassen');


	const query = { userIds: userId };

	return classesService.find({ query })
		.then(classes => Promise.all(
			classes.data.map((myClass) => {
				myClass.userIds.splice(myClass.userIds.indexOf(userId), 1);
				return classesService.patch(myClass._id, myClass);
			}),
		).then(_ => hook).catch((err) => { throw new errors.Forbidden('No Permission', err); }));
};

const removeStudentFromCourses = (hook) => {
	const coursesService = hook.app.service('/courses');
	const userId = hook.id;
	if (userId === undefined) throw new errors.BadRequest('Fehler beim Entfernen des Users aus abhängigen Kursen');

	const query = { userIds: userId };

	return coursesService.find({ query })
		.then(courses => Promise.all(
			courses.data.map((course) => {
				course.userIds.splice(course.userIds.indexOf(userId), 1);
				return coursesService.patch(course._id, course);
			}),
		).then(() => hook).catch((err) => { throw new errors.Forbidden('No Permission', err); }));
};

const sanitizeData = (hook) => {
	if ('email' in hook.data) {
		if (!constants.expressions.email.test(hook.data.email)) {
			return Promise.reject(new errors.BadRequest('Bitte gib eine valide E-Mail Adresse an!'));
		}
	}
	const idRegExp = RegExp('^[0-9a-fA-F]{24}$');
	if ('schoolId' in hook.data) {
		if (!idRegExp.test(hook.data.schoolId)) {
			return Promise.reject(new errors.BadRequest('invalid Id'));
		}
	}
	if ('classId' in hook.data) {
		if (!idRegExp.test(hook.data.classId)) {
			return Promise.reject(new errors.BadRequest('invalid Id'));
		}
	}
	return Promise.resolve(hook);
};

const checkJwt = () => function checkJwtfnc(hook) {
	if (((hook.params || {}).headers || {}).authorization !== undefined) {
		return (auth.hooks.authenticate('jwt')).call(this, hook);
	}
	return Promise.resolve(hook);
};

const pinIsVerified = (hook) => {
	if ((hook.params || {}).account && hook.params.account.userId) {
		return (globalHooks.hasPermission('USER_CREATE')).call(this, hook);
	}
	// eslint-disable-next-line no-underscore-dangle
	const email = (hook.params._additional || {}).parentEmail || hook.data.email;
	return hook.app.service('/registrationPins').find({ query: { email, verified: true } })
		.then((pins) => {
			if (pins.data.length === 1 && pins.data[0].pin) {
				const age = globalHooks.getAge(hook.data.birthday);

				if (!((hook.data.roles || []).includes('student') && age < 16)) {
					hook.app.service('/registrationPins').remove(pins.data[0]._id);
				}

				return Promise.resolve(hook);
			}
			return Promise.reject(new errors.BadRequest('Der Pin wurde noch nicht bei der Registrierung eingetragen.'));
		});
};

const mailToLowerCase = hook => {
	if(hook.data){
		if(hook.data.email){
			hook.data.email = hook.data.email.toLowerCase()
		}
		if(hook.data.parent_email){
			hook.data.parent_email = hook.data.parent_email.toLowerCase()
		}
		if(hook.data.student_email){
			hook.data.student_email = hook.data.student_email.toLowerCase()
		}
		return Promise.resolve(hook);
	}
}

// student administrator helpdesk superhero teacher parent
// eslint-disable-next-line no-unused-vars
const permissionRoleCreate = async (hook) => {
	if (!hook.params.provider) {
		// internal call
		return hook;
	}

	if (hook.data.length <= 0) {
		return Promise.reject(new errors.BadRequest('No input data.'));
	}

	let isLoggedIn = false;
	if (((hook.params || {}).account || {}).userId) {
		isLoggedIn = true;
		const userService = hook.app.service('/users/');
		const currentUser = await userService.get(hook.params.account.userId, { query: { $populate: 'roles' } });
		const userRoles = currentUser.roles.map(role => role.name);
		if (userRoles.includes('superhero')) {
			// call from superhero Dashboard
			return Promise.resolve(hook);
		}
	}

	if ((isLoggedIn === true && globalHooks.arrayIncludes(
		(hook.data.roles || []),
		['student', 'teacher'],
		['parent', 'administrator', 'helpdesk', 'superhero'],
	))
		|| (isLoggedIn === false && globalHooks.arrayIncludes(
			(hook.data.roles || []),
			['student', 'parent'],
			['teacher', 'administrator', 'helpdesk', 'superhero'],
		))
	) {
		return Promise.resolve(hook);
	}
	return Promise.reject(new errors.BadRequest('You have not the permissions to create this roles.'));
};

const securePatching = hook => Promise.all([
	globalHooks.hasRole(hook, hook.params.account.userId, 'superhero'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'administrator'),
	globalHooks.hasRole(hook, hook.params.account.userId, 'teacher'),
	globalHooks.hasRole(hook, hook.id, 'student'),
])
	.then(([isSuperHero, isAdmin, isTeacher, targetIsStudent]) => {
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
				return Promise.reject(new errors.BadRequest('You have not the permissions to change other users'));
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
	const protectedRoleIds = (protectedRoles.data || []).map(role => role._id);
	const isProtectedUser = protectedRoleIds.find(role => (user.roles || []).includes(role));

	user.age = globalHooks.getAge(user.birthday);

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
const decorateUser = hook => getDisplayName(hook.result, hook.app)
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
		(hook.result.data || []).forEach(user => setAvatarData(user));
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
	const userPromises = (hook.result.data || []).map(user => getDisplayName(user, hook.app).then((displayName) => {
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
	}).then(res => Promise.resolve(hook));
};

const pushRemoveEvent = (hook) => {
	hook.app.emit('users:after:remove', hook);
	return hook;
};

const enforceRoleHierarchyOnDelete = async (hook) => {
	try {
		if (globalHooks.hasRoleNoHook(hook, hook.params.account.userId, 'superhero')) return hook;

		const [targetIsStudent, targetIsTeacher, targetIsAdmin] = await Promise.all([
			globalHooks.hasRoleNoHook(hook, hook.id, 'student'),
			globalHooks.hasRoleNoHook(hook, hook.id, 'teacher'),
			globalHooks.hasRoleNoHook(hook, hook.id, 'administrator'),
		]);
		let permissionChecks = [true];
		if (targetIsStudent) {
			permissionChecks.push(globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'STUDENT_DELETE'));
		}
		if (targetIsTeacher) {
			permissionChecks.push(globalHooks.hasPermissionNoHook(hook, hook.params.account.userId, 'TEACHER_DELETE'));
		}
		if (targetIsAdmin) {
			permissionChecks.push(globalHooks.hasRoleNoHook(hook, hook.params.account.userId, 'superhero'));
		}
		permissionChecks = await Promise.all(permissionChecks);

		if (!permissionChecks.reduce((accumulator, val) => accumulator && val)) {
			throw new errors.Forbidden('you dont have permission to delete this user!', { hook });
		}

		return hook;
	} catch (error) {
		logger.error(error);
		return Promise.reject();
	}
};

const User = require('../model');


exports.before = {
	all: [],
	find: [
		globalHooks.mapPaginationQuery.bind(this),
		// resolve ids for role strings (e.g. 'TEACHER')
		globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),
		auth.hooks.authenticate('jwt'),
		globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
		mapRoleFilterQuery,
	],
	get: [auth.hooks.authenticate('jwt')],
	create: [
		checkJwt(),
		pinIsVerified,
		sanitizeData,
		checkUnique,
		checkUniqueAccount,
		globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
	],
	update: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_EDIT'),
		// TODO only local for LDAP
		sanitizeData,
		globalHooks.resolveToIds.bind(this, '/roles', 'data.$set.roles', 'name'),
	],
	patch: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('USER_EDIT'),
		globalHooks.ifNotLocal(securePatching),
		globalHooks.permitGroupOperation,
		sanitizeData,
		globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
		updateAccountUsername,
	],
	remove: [
		auth.hooks.authenticate('jwt'),
		globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
		globalHooks.ifNotLocal(enforceRoleHierarchyOnDelete),
		globalHooks.permitGroupOperation,
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
		globalHooks.computeProperty(User.userModel, 'getPermissions', 'permissions'),
		globalHooks.ifNotLocal(
			globalHooks.denyIfNotCurrentSchool({
				errorMessage: 'Der angefragte Nutzer gehört nicht zur eigenen Schule!',
			}),
		),
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
