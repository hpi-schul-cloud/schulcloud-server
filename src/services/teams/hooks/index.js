const { authenticate } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { Forbidden, NotFound, BadRequest, Conflict, NotImplemented, MethodNotAllowed, NotAcceptable } = reqlib(
	'src/errors'
);
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { SC_SHORT_TITLE } = require('../../../../config/globals');

const globalHooks = require('../../../hooks');
const logger = require('../../../logger');

const { set, get } = require('./scope');
const createEmailText = require('./mail-text.js');
const {
	populateUsersForEachUserIdinHookData,
	getTeamUsers,
	arrayRemoveAddDiffs,
	getTeam,
	updateMissingDataInHookForCreate,
	getSessionUser,
	ifSuperhero,
	isAcceptWay,
} = require('./helpers');
const {
	isArray,
	isArrayWithElement,
	isObject,
	isString,
	hasKey,
	isDefined,
	isUndefined,
	// isNull,
	// isObjectId,
	// isObjectIdWithTryToCast,
	throwErrorIfNotObjectId,
	bsonIdToString,
	isSameId,
	isFunction,
} = require('./collection');

/**
 *   main hook for team services
 *   @beforeHook
 *   @param {Object::hook} hook
 *   @method all
 *   @ifNotLocal work only for extern requests
 *   */
const teamMainHook = globalHooks.ifNotLocal((hook) =>
	Promise.all([getSessionUser(hook), getTeam(hook), populateUsersForEachUserIdinHookData(hook)])
		.then(([sessionUser, team, users]) => {
			const userId = bsonIdToString(hook.params.account.userId);
			const isSuperhero = ifSuperhero(sessionUser.roles);
			const { method } = hook;

			if (isUndefined([sessionUser, team, sessionUser.schoolId], 'OR')) {
				throw new BadRequest('Bad intern call. (3)');
			}
			const sessionSchoolId = bsonIdToString(sessionUser.schoolId);

			if (method === 'create') {
				// eslint-disable-next-line no-param-reassign
				team = updateMissingDataInHookForCreate(hook, sessionUser);
				users.push(sessionUser);
				hook.data = team;
			} else if (method === 'find') {
				hook.params.query.userIds = { $elemMatch: { userId } };
				return hook;
			}
			// test if session user is in team
			const isAccept = isAcceptWay(hook, team._id, team, users);

			if (isUndefined(isAccept)) {
				const userExist = team.userIds.some((_user) => isSameId(_user.userId, userId));
				const schoolExist = team.schoolIds.includes(sessionSchoolId);

				if (isUndefined([userExist, schoolExist], 'OR')) {
					throw new Forbidden('You have not the permission to access this. (1)', { userExist, schoolExist });
				}
			}

			let teamUsers;
			if (hasKey(hook, 'data') && isArrayWithElement(hook.data.userIds)) {
				teamUsers = getTeamUsers(hook, team, users, sessionSchoolId);
				hook.data.userIds = teamUsers;
			}

			set(hook, 'sessionUser', sessionUser);
			set(hook, 'isSuperhero', isSuperhero);
			set(hook, 'newUsers', teamUsers || []);

			return hook;
		})
		.catch((err) => {
			logger.warning(err);
			throw new BadRequest('Bad response.');
		})
);

/**
 * mapped userIds from class to userIds, clear all double userId inputs
 * @beforeHook
 * @param {Object::hook} hook
 * @return {Object::hook}
 */
const updateUsersForEachClass = (hook) => {
	if (hasKey(hook.data) || !isArrayWithElement(hook.data.classIds)) {
		return hook;
	}

	const newUserList = [hook.params.account.userId]; // add current userId?
	const add = (id) => {
		if (!newUserList.includes(id)) {
			throwErrorIfNotObjectId(id);
			newUserList.push(bsonIdToString(id));
		}
	};

	return hook.app
		.service('classes')
		.find({
			query: {
				$or: hook.data.classIds.map((_id) => {
					throwErrorIfNotObjectId(_id);
					return { _id };
				}),
			},
		})
		.then((classes) => {
			// add userIds from classes
			classes.data.forEach((classObj) => {
				classObj.userIds.forEach((_id) => {
					add(_id);
				});
			});

			// add userIds from userId list
			hook.data.userIds.forEach((objOrId) => {
				add(isObject(objOrId) ? objOrId.userId : objOrId);
			});
			// update userId list
			hook.data.userIds = newUserList;
			return hook;
		})
		.catch((err) => {
			logger.warning(err);
			throw new BadRequest('Wrong input. (6)');
		});
};

/**
 * test if id exist and id a valid moongose object id
 * @beforeHook
 * @param {Object::hook} hook
 * @return {Promise::hook}
 */
const existId = (hook) => {
	if (!['find', 'create'].includes(hook.method)) {
		if (!hook.id) {
			throw new Forbidden('Operation on this service requires an id!');
		}
		throwErrorIfNotObjectId(hook.id);
	}
	return hook;
};

/**
 * @beforeHook
 * @param {Object::hook} - test and update missing data for methodes that contain hook.data
 * @method post
 * @return {Object::hook}
 */
const testInputData = (hook) => {
	if (isUndefined(hook.data.userIds)) {
		hook.data.userIds = [];
	} else if (!isArray(hook.data.userIds)) {
		throw new BadRequest('Wrong input. (3)');
	}

	if (isUndefined(hook.data.classIds)) {
		hook.data.classIds = [];
	} else if (!isArray(hook.data.classIds)) {
		throw new BadRequest('Wrong input. (4)');
	}
	return hook;
};

/**
 * @beforeHook
 * @param {Object::hook} - block this methode for every request
 * @throws {errors} new errors.MethodNotAllowed('Method is not allowed!');
 */
const blockedMethod = () => {
	logger.warning('[teams]', 'Method is not allowed!');
	throw new MethodNotAllowed('Method is not allowed!');
};

/**
 * @hook
 * @ifNotLocal
 * @param {Array of strings} keys
 * @param {Array::String || StringPath} path - the object path to filtered data in hook or
 * @param {Boolean} [_ifNotLocal=true] - pass all input to the ifNotLocal hook
 * @param {Object} [objectToFilter] - is optional otherwise the hook is used
 * @return {function::globalHooks.ifNotLocal(hook)}
 * @example filterToRelated(['_id','userIds'], 'result.data') in hook.result.data all keys are removed
 * 			that are not _id, or userIds
 */
const filterToRelated = (keys, path, _ifNotLocal = true, objectToFilter) => {
	const keysArr = Array.isArray(keys) ? keys : [keys];
	const execute = (hook) => {
		const filter = (data) => {
			const reducer = (old) => (newObject, key) => {
				if (old[key] !== undefined) {
					// if related key exist
					newObject[key] = old[key];
				}
				return newObject;
			};

			let out;
			if (Array.isArray(data)) {
				out = data.map((element) => keysArr.reduce(reducer(element), {}));
			} else {
				out = keysArr.reduce(reducer(data), {});
			}
			return out;
		};

		if (typeof path === 'string') {
			path = path.split('.');
		}
		const result = objectToFilter || hook;
		let link;
		let linkKey;
		const target =
			path.length > 0
				? path.reduce((stack, key) => {
						if (stack[key] === undefined) {
							throw new NotImplemented('The path do not exist.');
						}
						const newTarget = stack[key];
						link = stack;
						linkKey = key;
						return newTarget;
				  }, result)
				: result;

		link[linkKey] = filter(target);
		return result;
	};

	let resHook;
	if (_ifNotLocal === true) {
		resHook = globalHooks.ifNotLocal(execute);
	} else {
		resHook = execute;
	}

	return resHook;
};
exports.filterToRelated = filterToRelated;

/**
 * @hook
 * @param {Object::hook}
 * @return {Object::hook}
 */
const dataExist = (hook) => {
	if (isUndefined(hook.data) || !isObject(hook.data)) {
		throw new BadRequest('Wrong input data.');
	}
	return hook;
};

/**
 * @afterHook
 * @param {Object::hook}
 * @return {Object::hook}
 */
const pushUserChangedEvent = async (hook) => {
	// todo take data from hook, postet data and return
	const team = await getTeam(hook);
	const oldUsers = team.userIds;
	const newUsers = hook.result.userIds;

	if (isUndefined(oldUsers) || isUndefined(newUsers)) {
		// logger.warning('No user infos.', { oldUsers, newUsers });
		// todo: cheak if undefined valid situation or not
		return hook;
	}

	const changes = arrayRemoveAddDiffs(oldUsers, newUsers, 'userId');

	if (isArrayWithElement(changes.remove) || isArrayWithElement(changes.add)) {
		set(hook, 'changes', changes);
		hook.app.emit('teams:after:usersChanged', hook);
	}

	return hook;
};

/**
 * Add teamroles to hook.teamroles.
 * Make avaible that you can use hook.findRole();
 * if you use it without hook object pass {app} as parameter
 * @hook
 * @param {Object::hook}
 * @return {Object::hook}
 */
const teamRolesToHook = (hook) => {
	/** execute one time */
	if (isFunction(hook.findRole) && isDefined(hook.teamroles)) {
		return hook;
	}
	return hook.app
		.service('roles')
		.find({
			query: { name: /team/i },
		})
		.then((roles) => {
			if (roles.data.length <= 0) {
				throw new NotFound('No team role found. (1)');
			}

			hook.teamroles = roles.data; // add team roles with permissions to hook

			/**
			 * @param {String} key
			 * @param {Object||String} value search value
			 * @param {String} [resultKey] if only one value of a key should return
			 * @example hook.findRole('name','teamowner');
			 * @example hook.findRole('name','teamleader','permissions');
			 */
			hook.findRole = (key, value, resultKey) => {
				// add a search function to hook
				const self = hook;

				if (isUndefined(self.teamroles)) {
					throw new NotFound('No team role found. (2)');
				}

				if (isUndefined(key) || isUndefined(value)) {
					logger.warning('Bad input for findRole: ', { key, value });
					throw new NotFound('No team role found. (3)');
				}
				// is already a role ..for example if request use $populate
				if (isObject(value) && value._id) {
					value = value[key];
				}
				const role = self.teamroles.find((teamroles) => teamroles[key].toString() === value.toString());
				let out;
				if (role && resultKey) {
					out = role[resultKey];
				} else if (role) {
					out = role;
				} else {
					logger.warning(JSON.stringify({ role, value, resultKey }));
					throw new NotFound('No team role found. (4)');
				}
				return out;
			};

			if (hook.method !== 'find') {
				const resolveInheritance = (role, stack = []) => {
					stack = stack.concat(role.permissions);
					if (role.roles.length <= 0) return stack;
					const searchRole = hook.findRole('_id', role.roles[0]); // take only first target ...more not exist
					return resolveInheritance(searchRole, stack);
				};

				hook.teamroles.forEach((role) => {
					const solvedAllPermissions = resolveInheritance(role);
					role.permissions = solvedAllPermissions;
				});
			}
			return hook;
		})
		.catch((err) => {
			throw new BadRequest('Can not resolve team roles.', err);
		});
};
exports.teamRolesToHook = teamRolesToHook;

/**
 * @hook
 * @method get,patch,delete,create but do not work with find
 * @param {Array::String||String} permsissions
 * @param {String} _teamId
 * @return {function::function(hook)}
 * @ifNotLocal
 */
const hasTeamPermission = (permsissions, _teamId) =>
	globalHooks.ifNotLocal((hook) => {
		if (get(hook, 'isSuperhero') === true) {
			return Promise.resolve(hook);
		}
		if (isString(permsissions)) {
			permsissions = [permsissions];
		}
		return Promise.all([getSessionUser(hook), teamRolesToHook(hook), getTeam(hook)])
			.then(([, ref, team]) => {
				if (get(hook, 'isSuperhero') === true) {
					return Promise.resolve(hook);
				}
				const userId = bsonIdToString(hook.params.account.userId);
				const teamId = _teamId || hook.teamId || hook.id;
				const teamUser = team.userIds.find((_user) => isSameId(_user.userId, userId));

				if (isUndefined(teamUser)) {
					throw new NotFound(`Session user is not in this team userId=${userId} teamId=${teamId}`);
				}

				const teamRoleId = teamUser.role;
				const userTeamPermissions = ref.findRole('_id', teamRoleId, 'permissions');

				permsissions.forEach((_permsission) => {
					if (userTeamPermissions.includes(_permsission) === false) {
						throw new Forbidden(`No permission=${_permsission} found!`);
					}
				});

				return Promise.resolve(hook);
			})
			.catch((err) => {
				logger.warning(err);
				throw new Forbidden('You have not the permission to access this. (2)');
			});
	});
exports.hasTeamPermission = hasTeamPermission; // to use it global

/**
 * Hook to reject patches of default file permissions if the patching user
 * does not have the permission DEFAULT_FILE_PERMISSIONS
 * @beforeHook
 */
const rejectDefaultFilePermissionUpdatesIfNotPermitted = (context) => {
	if (isUndefined(context.data)) {
		return context;
	}
	const updatesDefaultFilePermissions = isDefined(context.data.filePermission);
	if (updatesDefaultFilePermissions) {
		return hasTeamPermission('DEFAULT_FILE_PERMISSIONS')(context);
	}
	return context;
};
exports.rejectDefaultFilePermissionUpdatesIfNotPermitted = rejectDefaultFilePermissionUpdatesIfNotPermitted;

/*
 * @helper
 * @param {Object::hook} hook
 * @param {String||BsonId} firstId a teamRoleId
 * @param {String||BsonId} secondId another teamRoleId
 * @return {Boolena} returns true if the first Role is equal or higher in the hierarchy of team-roles
 */
const isHigherOrEqualTeamrole = (hook, firstId, secondId) => {
	const teamRoleHierarchy = ['teamleader', 'teamadministrator', 'teamowner'];
	const firstRole = hook.findRole('_id', firstId, 'name');
	const secondRole = secondId !== '' ? hook.findRole('_id', secondId, 'name') : '';
	return teamRoleHierarchy.indexOf(firstRole) >= teamRoleHierarchy.indexOf(secondRole);
};

/**
 * This hook test what is want to change and execute
 * for every changed keys the permission check for it.
 * @beforeHook
 * @ifNotLocal
 */
const testChangesForPermissionRouting = globalHooks.ifNotLocal(async (hook) => {
	const d = hook.data;
	if (isUndefined(d)) {
		return hook;
	}

	const sessionUser = await getSessionUser(hook);
	if (get(hook, 'isSuperhero')) return Promise.resolve(hook);

	// hasTeamPermission throw error if do not have the permission. Superhero is also test.
	if (isDefined([d.times, d.color, d.description, d.name, d.startDate, d.untilDate], 'OR')) {
		hasTeamPermission('RENAME_TEAM')(hook); // throw error if has not the permission
	}
	if (isUndefined(d.userIds)) {
		return hook;
	}
	return Promise.all([getTeam(hook), populateUsersForEachUserIdinHookData(hook)])
		.then(([team, users]) => {
			const changes = arrayRemoveAddDiffs(team.userIds, hook.data.userIds, 'userId'); // remove add
			const sessionSchoolId = sessionUser.schoolId;
			const sessionUserId = bsonIdToString(hook.params.account.userId);

			let isLeaveTeam = false;
			let isRemoveOthers = false;
			let isAddingFromOwnSchool = false;
			let isAddingFromOtherSchool = false;
			let hasChangeRole = false;
			let highestChangedRole = '';
			const leaveTeam = hasTeamPermission('LEAVE_TEAM');
			const removeMembers = hasTeamPermission('REMOVE_MEMBERS');
			const addSchoolMembers = hasTeamPermission('ADD_SCHOOL_MEMBERS');
			const changeTeamRoles = hasTeamPermission('CHANGE_TEAM_ROLES');

			changes.remove.forEach((e) => {
				if (isSameId(e.userId, sessionUserId)) {
					isLeaveTeam = true;
				} else {
					isRemoveOthers = true;
				}
			});

			changes.add.forEach((e) => {
				const user = users.find((u) => isSameId(e.userId, u._id));
				if (isSameId(user.schoolId, sessionSchoolId)) {
					isAddingFromOwnSchool = true;
				} else {
					isAddingFromOtherSchool = true;
				}
			});

			hook.data.userIds.forEach((_) => {
				const teamUser = team.userIds.find((tu) => isSameId(_.userId, tu.userId));
				if (isDefined(teamUser)) {
					if (isDefined(_.role) && !isSameId(teamUser.role, _.role)) {
						hasChangeRole = true;
						if (isHigherOrEqualTeamrole(hook, _.role, highestChangedRole)) highestChangedRole = _.role;
						if (isHigherOrEqualTeamrole(hook, teamUser.role, highestChangedRole)) {
							highestChangedRole = teamUser.role;
						}
					}
				}
			});

			const wait = [];
			if (isAddingFromOtherSchool) {
				throw new Forbidden('Can not adding users from other schools.');
			}
			if (isLeaveTeam) {
				wait.push(
					leaveTeam(hook).catch(() => {
						throw new Forbidden('Permission LEAVE_TEAM is missing.');
					})
				);
			}

			if (isRemoveOthers) {
				wait.push(
					removeMembers(hook).catch(() => {
						throw new Forbidden('Permission REMOVE_MEMBERS is missing.');
					})
				);
			}

			if (isAddingFromOwnSchool) {
				wait.push(
					addSchoolMembers(hook).catch(() => {
						throw new Forbidden('Permission ADD_SCHOOL_MEMBERS is missing.');
					})
				);
			}

			if (hasChangeRole) {
				wait.push(
					changeTeamRoles(hook).catch(() => {
						throw new Forbidden('Permission CHANGE_TEAM_ROLES is missing.');
					})
				);

				const sessionUserTeamUser = team.userIds.find((user) => equalIds(user.userId, sessionUserId));
				const sessionUserTeamRole = (sessionUserTeamUser || {}).role.toString();
				if (!isHigherOrEqualTeamrole(hook, sessionUserTeamRole, highestChangedRole)) {
					wait.push(Promise.reject(new Forbidden('You cant change a Permission higher than yours')));
				}
			}

			return Promise.all(wait)
				.then(() => hook)
				.catch((err) => {
					throw err;
				});
		})
		.catch((err) => {
			logger.warning(err);
			throw new Forbidden('You have not the permission to access this. (4)');
		});
});

const sendInfo = (hook) => {
	const email = hook.data.email || (hook.result.user || {}).email;

	if (isUndefined(email) || isUndefined(hook.result.linkData)) {
		return hook;
	}

	return getSessionUser(hook)
		.then((user) => {
			globalHooks.sendEmail(hook, {
				subject: `${SC_SHORT_TITLE}: Team-Einladung`,
				emails: [email],
				content: {
					text: createEmailText(hook, user),
				},
			});
			return hook;
		})
		.catch((err) => {
			logger.warning(err);
			throw new NotAcceptable('Errors on user detection');
		});
};
// exports.sendInfo = sendInfo;

/**
 * @afterHook
 * @method patch,get
 * @param {Object::hook} hook - Add the current user to top level,
 *                              easy access of it role and permissions.
 * @return {Object::hook}
 */
const addCurrentUser = globalHooks.ifNotLocal((hook) => {
	if (hasKey(hook.result, 'userIds')) {
		const userId = bsonIdToString(hook.params.account.userId);
		const { userIds } = hook.result;
		const user = {
			...userIds.find((u) => isSameId(u.userId._id || u.userId, userId)),
		};
		if (isUndefined([user, user.role], 'OR')) {
			logger.warning(
				'Can not execute addCurrentUser for unknown user. ' +
					'Or user execute a patch with the result that he has left the team.',
				{ userId }
			);
			return hook;
		}
		const roleId = (user.role || {})._id || user.role; // first populated, second only id;
		throwErrorIfNotObjectId(roleId);
		const role = hook.findRole('_id', roleId);
		user.permissions = role.permissions;
		user.name = role.name;
		hook.result.user = user;
	}
	return hook;
});

/**
 * Test if the sessionUser is allowed to create a team. Every teacher and admin can create teams.
 * Students can create teams if it is not disabled (can be blocked by school settings)
 * If not throw an error.
 * @beforeHook
 */
const isAllowedToCreateTeams = (hook) =>
	getSessionUser(hook).then((sessionUser) =>
		hook.app
			.service('schools')
			.get(hook.data.schoolId)
			.then((school) => {
				const roleNames = sessionUser.roles.map((role) => role.name);
				if (
					roleNames.includes('superhero') ||
					roleNames.includes('administrator') ||
					roleNames.includes('teacher') ||
					roleNames.includes('student')
				) {
					if (roleNames.includes('student') && !school.isTeamCreationByStudentsEnabled) {
						throw new Forbidden('Your school admin does not allow team creations by students.');
					}
				} else {
					throw new Forbidden('Only administrator, teacher and students can create teams.');
				}

				return hook;
			})
	);

/**
 * Test if data.userId is set. If true it test if the role is teacher. If not throw an error.
 * @beforeHook
 */
const isTeacherDirectlyImport = (hook) => {
	const { userId } = hook.data;
	if (userId) {
		return hook.app
			.service('users')
			.get(userId, { query: { $populate: 'roles' } })
			.then((user) => {
				const roleNames = user.roles.map((role) => role.name);
				if (!roleNames.includes('teacher')) {
					throw new BadRequest('Is no teacher');
				}
				return hook;
			})
			.catch((err) => {
				logger.warning(err);
				throw new Forbidden('You have not the permission to do this.');
			});
	}
	return hook;
};

/**
 * Test if the sessionUser has the role administrator.
 * If not throw an error.
 * @beforeHook
 */
const isAdmin = (hook) =>
	getSessionUser(hook).then((sessionUser) => {
		const roleNames = sessionUser.roles.map((role) => role.name);
		if (!roleNames.includes('administrator')) {
			throw new Forbidden('Only administrators can do this.');
		}

		return hook;
	});

/**
 * @afterHook
 */
const isUserIsEmpty = (hook) => {
	let out;
	if (hasKey(hook.result, 'userIds') && isDefined(hook.id)) {
		if (!isArrayWithElement(hook.result.userIds)) {
			out = hook.app
				.service('teams')
				.remove(hook.id)
				.then(() => {
					hook.result = {};
					return hook;
				})
				.catch((err) => {
					logger.warning(err);
					throw new Conflict('It want to remove the team with no user, but do not found it.');
				});
		}
	} else {
		out = hook;
	}
	return out;
};

const keys = {
	resFind: ['_id', 'name', 'times', 'description', 'userIds', 'color'],
	resId: ['_id'],
	query: ['$populate', '$limit', '$skip'],
	data: [
		'filePermission',
		'name',
		'times',
		'description',
		'userIds',
		'color',
		'features',
		'ltiToolIds',
		'classIds',
		'startDate',
		'untilDate',
		'schoolId',
	],
};

// todo: TeamPermissions
exports.before = {
	all: [
		authenticate('jwt'),
		existId,
		filterToRelated(keys.query, 'params.query'),
		globalHooks.ifNotLocal(teamRolesToHook),
	],
	find: [teamMainHook],
	get: [teamMainHook],
	create: [
		filterToRelated(keys.data, 'data'),
		globalHooks.injectUserId,
		isAllowedToCreateTeams,
		testInputData,
		updateUsersForEachClass,
		teamMainHook,
	], // inject is needing?
	update: [blockedMethod],
	patch: [
		rejectDefaultFilePermissionUpdatesIfNotPermitted,
		testChangesForPermissionRouting,
		updateUsersForEachClass,
		teamMainHook,
		hasTeamPermission('RENAME_TEAM'),
	], // todo: filterToRelated(keys.data,'data')
	remove: [teamMainHook, hasTeamPermission('DELETE_TEAM')],
};

// todo:clear unused values
// todo: update moongose
exports.after = {
	all: [],
	find: [filterToRelated(keys.resFind, 'result.data')], // filterFindResult
	get: [addCurrentUser], // see before (?)
	create: [filterToRelated(keys.resId, 'result')],
	update: [], // test schoolId remove
	patch: [isUserIsEmpty, addCurrentUser, pushUserChangedEvent], // test schoolId remove
	remove: [filterToRelated(keys.resId, 'result')],
};

exports.beforeExtern = {
	all: [authenticate('jwt'), existId, filterToRelated([], 'params.query')],
	find: [],
	get: [],
	create: [blockedMethod],
	update: [blockedMethod],
	patch: [
		dataExist,
		teamRolesToHook,
		globalHooks.hasPermission('TEAM_INVITE_EXTERNAL'),
		hasTeamPermission(['INVITE_EXPERTS', 'INVITE_ADMINISTRATORS']),
		filterToRelated(['userId', 'email', 'role'], 'data'),
		globalHooks.blockDisposableEmail('email'),
		isTeacherDirectlyImport,
	], // later with switch ..see role names
	remove: [blockedMethod],
};

exports.afterExtern = {
	all: [],
	find: [filterToRelated(keys.resFind, 'result.data')],
	get: [],
	create: [],
	update: [],
	patch: [sendInfo, filterToRelated(['message', '_id'], 'result', false)],
	remove: [],
};

exports.beforeAdmin = {
	all: [authenticate('jwt'), isAdmin, existId],
	find: [],
	get: [blockedMethod],
	create: [],
	update: [blockedMethod],
	patch: [filterToRelated('userId', 'data')],
	remove: [],
};

exports.afterAdmin = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
