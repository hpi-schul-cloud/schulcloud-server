const { authenticate } = require('@feathersjs/authentication');
const { keep } = require('feathers-hooks-common');

const { Forbidden, NotFound, BadRequest, GeneralError } = require('../../../errors');
const logger = require('../../../logger');
const { ObjectId } = require('../../../helper/compare');
const { hasRoleNoHook, hasPermissionNoHook, hasPermission } = require('../../../hooks');

const { getAge } = require('../../../utils');

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
const getProtectedRoles = (hook) =>
	hook.app.service('/roles').find({
		// load protected roles
		query: {
			// TODO: cache these
			name: ['teacher', 'admin'],
		},
	});

const checkUnique = (hook) => {
	const userService = hook.service;
	const { email } = hook.data;
	if (email === undefined) {
		return Promise.reject(new BadRequest('Fehler beim Auslesen der E-Mail-Adresse bei der Nutzererstellung.'));
	}
	return userService.find({ query: { email: email.toLowerCase() } }).then((result) => {
		const { length } = result.data;
		if (length === undefined || length >= 2) {
			return Promise.reject(new BadRequest('Fehler beim Prüfen der Datenbankinformationen.'));
		}
		if (length === 0) {
			return Promise.resolve(hook);
		}

		const user = typeof result.data[0] === 'object' ? result.data[0] : {};
		const input = typeof hook.data === 'object' ? hook.data : {};
		const isLoggedIn = (hook.params || {}).account && hook.params.account.userId;
		// eslint-disable-next-line no-underscore-dangle
		const { asTask } = hook.params._additional || {};

		if (isLoggedIn || asTask === undefined || asTask === 'student') {
			return Promise.reject(new BadRequest(`Die E-Mail Adresse ist bereits in Verwendung!`));
		}
		return Promise.resolve(hook);
	});
};

const checkUniqueEmail = async (hook) => {
	const { email } = hook.data;
	if (!email) {
		// there is no email address given. Nothing to check...
		return Promise.resolve(hook);
	}

	// get userId of user entry to edit
	const editUserId = hook.id ? hook.id.toString() : undefined;
	const unique = await hook.app.service('nest-account-service').isUniqueEmailForUser(email, editUserId);

	if (unique) {
		return hook;
	}
	throw new BadRequest(`Die E-Mail Adresse ist bereits in Verwendung!`);
};

const checkUniqueAccount = (hook) => {
	const { email } = hook.data;
	return hook.app
		.service('nest-account-service')
		.searchByUsernameExactMatch(email.toLowerCase())
		.then(([result]) => {
			if (result.length > 0) {
				throw new BadRequest(`Ein Account mit dieser E-Mail Adresse ${email} existiert bereits!`);
			}
			return hook;
		});
};

const updateAccountUsername = async (context) => {
	let {
		params: { account },
	} = context;
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
		account = await app.service('nest-account-service').findByUserId(context.id);

		if (!account) return context;
	}

	if (email && account.systemId) {
		delete context.data.email;
		return context;
	}

	await app
		.service('nest-account-service')
		.updateUsername(account.id ? account.id : account._id.toString(), email)
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
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.'
		);
	}

	try {
		const usersClasses = await classesService.find({ query: { userIds: { $in: userIds } } });
		await Promise.all(
			usersClasses.data.map((klass) => classesService.patch(klass._id, { $pull: { userIds: { $in: userIds } } }))
		);
	} catch (err) {
		throw new Forbidden(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.',
			err
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
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.'
		);
	}

	try {
		const usersCourses = await coursesService.find({ query: { userIds: { $in: userIds } } });
		await Promise.all(
			usersCourses.data.map((course) =>
				hook.app.service('courseModel').patch(course._id, { $pull: { userIds: { $in: userIds } } })
			)
		);
	} catch (err) {
		throw new Forbidden(
			'Der Nutzer wurde gelöscht, konnte aber eventuell nicht aus allen Klassen/Kursen entfernt werden.',
			err
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

const checkJwt = () =>
	function checkJwtfnc(hook) {
		if (((hook.params || {}).headers || {}).authorization !== undefined) {
			return authenticate('jwt').call(this, hook);
		}
		return Promise.resolve(hook);
	};

const pinIsVerified = (hook) => {
	if ((hook.params || {}).account && hook.params.account.userId) {
		return hasPermission(['STUDENT_CREATE', 'TEACHER_CREATE', 'ADMIN_CREATE']).call(this, hook);
	}
	// eslint-disable-next-line no-underscore-dangle
	const email = (hook.params._additional || {}).parentEmail || hook.data.email;
	return hook.app
		.service('/registrationPins')
		.find({ query: { email, verified: true } })
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

const protectImmutableAttributes = async (context) => {
	const userIsSuperhero = await hasRoleNoHook(context, context.params.account.userId, 'superhero');
	if (userIsSuperhero) return context;

	delete context.data.roles;
	delete (context.data.$push || {}).roles;
	delete (context.data.$pull || {}).roles;
	delete (context.data.$pop || {}).roles;
	delete (context.data.$addToSet || {}).roles;
	delete (context.data.$pullAll || {}).roles;
	delete (context.data.$set || {}).roles;

	delete context.data.schoolId;
	delete (context.data.$set || {}).schoolId;

	return context;
};

const securePatching = async (context) => {
	const targetUser = await context.app.service('users').get(context.id, { query: { $populate: 'roles' } });
	const actingUser = await context.app
		.service('users')
		.get(context.params.account.userId, { query: { $populate: 'roles' } });
	const isSuperHero = actingUser.roles.find((r) => r.name === 'superhero');
	const isAdmin = actingUser.roles.find((r) => r.name === 'administrator');
	const isTeacher = actingUser.roles.find((r) => r.name === 'teacher');
	const targetIsStudent = targetUser.roles.find((r) => r.name === 'student');

	if (isSuperHero) {
		return context;
	}

	if (!ObjectId.equal(targetUser.schoolId, actingUser.schoolId)) {
		return Promise.reject(new NotFound(`no record found for id '${context.id.toString()}'`));
	}

	if (!ObjectId.equal(context.id, context.params.account.userId)) {
		if (!(isAdmin || (isTeacher && targetIsStudent))) {
			return Promise.reject(new BadRequest('You have not the permissions to change other users'));
		}
	}
	return Promise.resolve(context);
};

const formatLastName = (name, isOutdated) => `${name}${isOutdated ? ' ~~' : ''}`;

/**
 *
 * @param user {object} - the user the display name has to be generated
 * @param app {object} - the global feathers-app
 * @returns {string} - a display name of the given user
 */
const getDisplayName = (user, protectedRoles) => {
	const protectedRoleIds = (protectedRoles.data || []).map((role) => role._id);
	const isProtectedUser = protectedRoleIds.find((role) => (user.roles || []).includes(role));

	const isOutdated = !!user.outdatedSince;

	user.age = getAge(user.birthday);

	if (isProtectedUser) {
		return user.lastName ? formatLastName(user.lastName, isOutdated) : user._id;
	}
	return user.lastName ? `${user.firstName} ${formatLastName(user.lastName, isOutdated)}` : user._id;
};

/**
 *
 * @param hook {object} - the hook of the server-request
 * @returns {object} - the hook with the decorated user
 */
const decorateUser = async (hook) => {
	const protectedRoles = await getProtectedRoles(hook);
	const displayName = getDisplayName(hook.result, protectedRoles);
	hook.result = hook.result.constructor.name === 'model' ? hook.result.toObject() : hook.result;
	hook.result.displayName = displayName;
	return hook;
};

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
		hook.result = hook.result.constructor.name === 'model' ? hook.result.toObject() : hook.result;
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
const decorateUsers = async (hook) => {
	hook.result = hook.result.constructor.name === 'model' ? hook.result.toObject() : hook.result;
	const protectedRoles = await getProtectedRoles(hook);
	const users = (hook.result.data || []).map((user) => {
		user.displayName = getDisplayName(user, protectedRoles);
		return user;
	});
	hook.result.data = users;
	return hook;
};

const handleClassId = (hook) => {
	if (!('classId' in hook.data)) {
		return Promise.resolve(hook);
	}
	return hook.app
		.service('/classes')
		.patch(hook.data.classId, {
			$push: { userIds: hook.result._id },
		})
		.then((res) => Promise.resolve(hook));
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
		rolePromises.push(
			context.app
				.service('roles')
				.find({ query: { name: 'student' } })
				.then((r) => r.data[0]._id)
		);
	}
	if (canDeleteTeacher) {
		rolePromises.push(
			context.app
				.service('roles')
				.find({ query: { name: 'teacher' } })
				.then((r) => r.data[0]._id)
		);
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
	const user = await context.app.service('users').get(context.params.account.userId, { query: { $populate: 'roles' } });

	// superhero may create users with every role
	if (user.roles.filter((u) => u.name === 'superhero').length > 0) {
		return Promise.resolve(context);
	}

	// created user has no role
	if (!context.data || !context.data.roles) {
		return Promise.resolve(context);
	}
	await Promise.all(
		context.data.roles.map(async (roleId) => {
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
		})
	);

	return Promise.resolve(context);
};

const generateRegistrationLink = async (context) => {
	const { data, app } = context;
	if (data.generateRegistrationLink === true) {
		delete data.generateRegistrationLink;
		if (!data.roles || data.roles.length > 1) {
			throw new BadRequest('Roles must be exactly of length one if generateRegistrationLink=true is set.');
		}
		const { hash } = await app
			.service('/registrationlink')
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
			users: [result],
		});
	}
	return context;
};

const filterResult = async (context) => {
	const userCallingHimself = context.id && ObjectId.equal(context.id, context.params.account.userId);
	const userIsSuperhero = await hasRoleNoHook(context, context.params.account.userId, 'superhero');
	if (userCallingHimself || userIsSuperhero) {
		return context;
	}

	const allowedAttributes = [
		'_id',
		'roles',
		'schoolId',
		'firstName',
		'middleName',
		'lastName',
		'namePrefix',
		'nameSuffix',
		'discoverable',
		'fullName',
		'displayName',
		'avatarInitials',
		'avatarBackgroundColor',
		'outdatedSince',
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
			roleCache = (
				await context.app.service('roles').find({
					query: {
						name: { $in: ['administrator', 'teacher', 'student'] },
					},
					paginate: false,
				})
			).map((r) => r._id);
		}
		const allowedRoles = roleCache;

		if (context.params.query.roles && context.params.query.roles.$in) {
			// when querying for specific roles, filter them
			context.params.query.roles.$in = context.params.query.roles.$in.filter((r) =>
				allowedRoles.some((a) => ObjectId.equal(r, a))
			);
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
	checkUniqueEmail,
	checkJwt,
	checkUniqueAccount,
	updateAccountUsername,
	removeStudentFromClasses,
	removeStudentFromCourses,
	sanitizeData,
	pinIsVerified,
	protectImmutableAttributes,
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
