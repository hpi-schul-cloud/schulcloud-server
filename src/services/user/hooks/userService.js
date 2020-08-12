const { authenticate } = require('@feathersjs/authentication');
const { keep } = require('feathers-hooks-common');
const {
	BadRequest, Forbidden, GeneralError, NotFound,
} = require('@feathersjs/errors');
const logger = require('../../../logger');
const { ObjectId } = require('../../../helper/compare');
const {
	hasRole,
	hasRoleNoHook,
	hasPermissionNoHook,
	hasPermission,
} = require('../../../hooks');

const {
	getAge,
} = require('../../../utils');

const constants = require('../../../utils/constants');
const { CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS, SC_DOMAIN } = require('../../../../config/globals');

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
	let { params: { account } } = context;
	const {
		data: { email },
		app,
	} = context;

	if (!email) {
		return context;
	}

	if (!context.id) {
		throw new BadRequest('Id is required for email changes');
	}

	if (!account || !ObjectId.equal(context.id, account.userId)) {
		account = (await app.service('/accounts')
			.find({ query: { userId: context.id } }))[0];

		if (!account) return context;
	}

	if (email && account.systemId) {
		delete context.data.email;
		return context;
	}

	await app.service('/accounts')
		// set account in params to context.parmas.account to reference the current user
		.patch(account._id, { username: email }, { account: context.params.account })
		.catch((err) => {
			throw new BadRequest('Can not update account username.', err);
		});
	return context;
};

const removeStudentFromClasses = async (hook) => {
	// todo: move this functionality into classes, using events.
	// todo: what about teachers?
	const classesService = hook.app.service('/classes');
	const userIds = hook.id || (hook.result || []).map((u) => u._id);
	if (userIds === undefined) {
		throw new BadRequest(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.',
		);
	}

	try {
		const usersClasses = await classesService.find({ query: { userIds: { $in: userIds } } });
		await Promise.all(usersClasses.data.map(
			(klass) => classesService.patch(klass._id, { $pull: { userIds: { $in: userIds } } }),
		));
	} catch (err) {
		throw new Forbidden(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.', err,
		);
	}

	return hook;
};

const removeStudentFromCourses = async (hook) => {
	// todo: move this functionality into courses, using events.
	// todo: what about teachers?
	const coursesService = hook.app.service('/courses');
	const userIds = hook.id || (hook.result || []).map((u) => u._id);
	if (userIds === undefined) {
		throw new BadRequest(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.',
		);
	}

	try {
		const usersCourses = await coursesService.find({ query: { userIds: { $in: userIds } } });
		await Promise.all(usersCourses.data.map(
			(course) => hook.app.service('courseModel').patch(course._id, { $pull: { userIds: { $in: userIds } } }),
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

const securePatching = async (context) => {
	const targetUser = await context.app.service('users').get(context.id, { query: { $populate: 'roles' } });
	const actingUser = await context.app.service('users').get(
		context.params.account.userId,
		{ query: { $populate: 'roles' } },
	);
	const isSuperHero = actingUser.roles.find((r) => r.name === 'superhero');
	const isAdmin = actingUser.roles.find((r) => r.name === 'administrator');
	const isTeacher = actingUser.roles.find((r) => r.name === 'teacher');
	const isDemoStudent = actingUser.roles.find((r) => r.name === 'demoStudent');
	const isDemoTeacher = actingUser.roles.find((r) => r.name === 'demoTeacher');
	const targetIsStudent = targetUser.roles.find((r) => r.name === 'student');

	if (isSuperHero) {
		return context;
	}

	if (isDemoStudent || isDemoTeacher) {
		return Promise.reject(new Forbidden('Diese Funktion ist im Demomodus nicht verfügbar!'));
	}

	if (!ObjectId.equal(targetUser.schoolId, actingUser.schoolId)) {
		return Promise.reject(new NotFound(`no record found for id '${context.id.toString()}'`));
	}

	delete context.data.schoolId;
	delete (context.data.$set || {}).schoolId;

	if (!isAdmin) {
		delete context.data.roles;
		delete (context.data.$push || {}).roles;
		delete (context.data.$pull || {}).roles;
		delete (context.data.$pop || {}).roles;
		delete (context.data.$addToSet || {}).roles;
		delete (context.data.$pullAll || {}).roles;
		delete (context.data.$set || {}).roles;
	}
	if (!ObjectId.equal(context.id, context.params.account.userId)) {
		if (!(isAdmin || (isTeacher && targetIsStudent))) {
			return Promise.reject(new BadRequest('You have not the permissions to change other users'));
		}
	}
	return Promise.resolve(context);
};

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

const enforceRoleHierarchyOnDeleteSingle = async (context) => {
	try {
		const userIsSuperhero = await hasRoleNoHook(context, context.params.account.userId, 'superhero');
		if (userIsSuperhero) return context;

		const [targetIsStudent, targetIsTeacher, targetIsAdmin] = await Promise.all([
			hasRoleNoHook(context, context.id, 'student'),
			hasRoleNoHook(context, context.id, 'teacher'),
			hasRoleNoHook(context, context.id, 'administrator'),
		]);
		let permissionChecks = [true];
		if (targetIsStudent) {
			permissionChecks.push(hasPermissionNoHook(context, context.params.account.userId, 'STUDENT_DELETE'));
		}
		if (targetIsTeacher) {
			permissionChecks.push(hasPermissionNoHook(context, context.params.account.userId, 'TEACHER_DELETE'));
		}
		if (targetIsAdmin) {
			permissionChecks.push(hasRoleNoHook(context, context.params.account.userId, 'superhero'));
		}
		permissionChecks = await Promise.all(permissionChecks);

		if (!permissionChecks.reduce((accumulator, val) => accumulator && val)) {
			throw new Forbidden('you dont have permission to delete this user!');
		}

		return context;
	} catch (error) {
		logger.error(error);
		throw new Forbidden('you dont have permission to delete this user!');
	}
};

const enforceRoleHierarchyOnDeleteBulk = async (context) => {
	const user = await context.app.service('users').get(context.params.account.userId);
	const canDeleteStudent = user.permissions.includes('STUDENT_DELETE');
	const canDeleteTeacher = user.permissions.includes('TEACHER_DELETE');
	const rolePromises = [];
	if (canDeleteStudent) {
		rolePromises.push(context.app.service('roles').find({ query: { name: 'student' } }).then((r) => r.data[0]._id));
	}
	if (canDeleteTeacher) {
		rolePromises.push(context.app.service('roles').find({ query: { name: 'teacher' } }).then((r) => r.data[0]._id));
	}
	const allowedRoles = await Promise.all(rolePromises);

	// there may not be any role in user.roles that is not in rolesToDelete
	const roleQuery = { $nor: [{ roles: { $elemMatch: { $nin: allowedRoles } } }] };
	context.params.query = { $and: [context.params.query, roleQuery] };
	return context;
};

const enforceRoleHierarchyOnDelete = async (context) => {
	if (context.id) return enforceRoleHierarchyOnDeleteSingle(context);
	return enforceRoleHierarchyOnDeleteBulk(context);
};

/**
 * Check that the authenticated user posseses the rights to create a user with the given roles.
 * This is only checked for external requests.
 * @param {*} context
 */
const enforceRoleHierarchyOnCreate = async (context) => {
	const user = await context.app.service('users').get(
		context.params.account.userId, { query: { $populate: 'roles' } },
	);

	// superhero may create users with every role
	if (user.roles.filter((u) => (u.name === 'superhero')).length > 0) {
		return Promise.resolve(context);
	}

	// created user has no role
	if (!context.data || !context.data.roles) {
		return Promise.resolve(context);
	}
	await Promise.all(context.data.roles.map(async (roleId) => {
		// Roles are given by ID or by name.
		// For IDs we load the name from the DB.
		// If it is not an ID we assume, it is a name. Invalid names are rejected in the switch anyways.
		let roleName = '';
		if (!ObjectId.isValid(roleId)) {
			roleName = roleId;
		} else {
			try {
				const role = await context.app.service('roles').get(roleId);
				roleName = role.name;
			} catch (exception) {
				return Promise.reject(new BadRequest('No such role exists'));
			}
		}
		switch (roleName) {
			case 'teacher':
				if (!user.permissions.find((permission) => permission === 'TEACHER_CREATE')) {
					return Promise.reject(new BadRequest('Your are not allowed to create a user with the given role'));
				}
				break;
			case 'student':
				if (!user.permissions.find((permission) => permission === 'STUDENT_CREATE')) {
					return Promise.reject(new BadRequest('Your are not allowed to create a user with the given role'));
				}
				break;
			case 'parent':
				break;
			default:
				return Promise.reject(new BadRequest('Your are not allowed to create a user with the given role'));
		}
		return Promise.resolve(context);
	}));

	return Promise.resolve(context);
};

const generateRegistrationLink = async (context) => {
	const { data, app } = context;
	if (data.generateRegistrationLink === true) {
		delete data.generateRegistrationLink;
		if (!data.roles || data.roles.length > 1) {
			throw new BadRequest('Roles must be exactly of length one if generateRegistrationLink=true is set.');
		}
		const { hash } = await app.service('/registrationlink')
			// set account in params to context.parmas.account to reference the current user
			.create({
				role: data.roles[0],
				save: true,
				patchUser: true,
				host: SC_DOMAIN,
				schoolId: data.schoolId,
				toHash: data.email,
			})
			.catch((err) => {
				throw new GeneralError(`Can not create registrationlink. ${err}`);
			});
		context.data.importHash = hash;
	}
};

const sendRegistrationLink = async (context) => {
	const { result, data, app } = context;
	if (data.sendRegistration === true) {
		delete data.sendRegistration;
		await app.service('/users/mail/registrationLink').create({
			userIds: [result._id],
		});
	}
	return context;
};


const filterResult = async (context) => {
	const userCallingHimself = ObjectId.equal(context.id, context.params.account.userId);
	const userIsSuperhero = await hasRoleNoHook(context, context.params.account.userId, 'superhero');
	if (userCallingHimself || userIsSuperhero) {
		return context;
	}

	const allowedAttributes = [
		'_id', 'roles', 'schoolId', 'firstName', 'middleName', 'lastName',
		'namePrefix', 'nameSuffix', 'discoverable', 'fullName',
		'displayName', 'avatarInitials', 'avatarBackgroundColor',
	];
	return keep(...allowedAttributes)(context);
};

let roleCache = null;
const includeOnlySchoolRoles = async (context) => {
	if (context.params && context.params.query) {
		const userIsSuperhero = await hasRoleNoHook(context, context.params.account.userId, 'superhero');
		if (userIsSuperhero) {
			return context;
		}

		// todo: remove with static role service (SC-3731)
		if (!Array.isArray(roleCache)) {
			roleCache = (await context.app.service('roles').find({
				query: {
					name: { $in: ['administrator', 'teacher', 'student'] },
				},
				paginate: false,
			})).map((r) => r._id);
		}
		const allowedRoles = roleCache;

		if (context.params.query.roles && context.params.query.roles.$in) {
			// when querying for specific roles, filter them
			context.params.query.roles.$in = context.params.query.roles.$in
				.filter((r) => allowedRoles.some((a) => ObjectId.equal(r, a)));
		} else {
			// otherwise, overwrite them with whitelist
			context.params.query.roles = {
				$in: allowedRoles,
			};
		}
	}
	return context;
};

module.exports = {
	mapRoleFilterQuery,
	checkUnique,
	checkJwt,
	checkUniqueAccount,
	updateAccountUsername,
	removeStudentFromClasses,
	removeStudentFromCourses,
	sanitizeData,
	pinIsVerified,
	securePatching,
	decorateUser,
	decorateAvatar,
	decorateUsers,
	handleClassId,
	pushRemoveEvent,
	enforceRoleHierarchyOnDelete,
	enforceRoleHierarchyOnCreate,
	filterResult,
	generateRegistrationLink,
	sendRegistrationLink,
	includeOnlySchoolRoles,
};
