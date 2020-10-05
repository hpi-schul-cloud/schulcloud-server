const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');
const { warning } = require('../../logger/index');
const { teamRolesToHook } = require('./hooks');
const { isArrayWithElement, isDefined, bsonIdToString } = require('./hooks/collection');

/**
 * It is important to use the params information from original request
 * and defined the request to local.
 * @param {*} params
 */
const local = (params) => {
	if (typeof (params || {}).provider !== 'undefined') {
		delete params.provider;
	}
	return params;
};

/**
 * @param {*} team
 * @param {*} user
 */
exports.getUpdatedSchoolIdArray = (team, user) => {
	const schoolIds = bsonIdToString(team.schoolIds);
	const userSchoolId = bsonIdToString(user.schoolId);

	if (schoolIds.includes(userSchoolId) === false) {
		schoolIds.push(userSchoolId);
	}

	return schoolIds;
};

/**
 * @param {*} team
 * @param {*} email
 */
exports.removeInvitedUserByEmail = (team, email) => team.invitedUserIds.filter((user) => user.email !== email);

/**
 * @param {*} app
 * @param {*} params
 */
const getSessionUser = (refClass, params, userId) => {
	const sesessionUserId = userId || bsonIdToString((params.account || {}).userId);

	return refClass.app
		.service('users')
		.get(sesessionUserId)
		.catch((err) => {
			warning(err);
			throw new Forbidden('You have not the permission.');
		});
};
exports.getSessionUser = getSessionUser;

/**
 * @param {*} app
 * @param {*} teamId
 * @param {*} data
 * @param {*} params
 */

exports.patchTeam = (refClass, teamId, data, params) =>
	refClass.app
		.service('teams')
		.patch(teamId, data, local(params))
		.catch((err) => {
			warning(err);
			throw new BadRequest('Can not patch team.');
		});

/**
 * @param {*} app
 * @param {*} teamId
 */
const getTeam = (refClass, teamId) => {
	// todo: app to this -> this.app
	const populateParams = {
		query: {
			$populate: [{ path: 'roles' }, { path: 'userIds.userId' }],
		},
	};
	return refClass.app
		.service('teams')
		.get(teamId, populateParams)
		.catch((err) => {
			warning(err);
			throw new Forbidden('You have not the permission.');
		});
};
exports.getTeam = getTeam;

exports.extractOne = (find, key) => {
	if (find.total !== 1 && isArrayWithElement(find.data)) {
		throw new BadRequest('Can not extract one from find data.');
	}
	// eslint-disable-next-line no-param-reassign
	find = isDefined(key) ? find.data[0][key] : find.data[0];
	return Promise.resolve(find);
};

/**
 * The hooks.teamRolesToHook(refClass) is execute one time for refClass, to added.
 * To load new data, the docker instance must be restarted.
 * It loads all team roles and give you a function
 * this.findRole('name', 'teamowner', '_id'); to select it.
 * @param {*} refClass
 * @param {*} teamId
 * @param {*} params
 */
exports.getBasic = (refClass, teamId, params, userId) =>
	Promise.all([teamRolesToHook(refClass), getSessionUser(refClass, params, userId), getTeam(refClass, teamId)]);
