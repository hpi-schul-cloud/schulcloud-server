// eslint-disable-next-line max-classes-per-file
const service = require('feathers-mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { NotFound, BadRequest, GeneralError } = require('../../errors');
const hooks = require('./hooks');
const { warning } = require('../../logger/index');
const { teamsModel } = require('./model');
const { userModel } = require('../user/model');
const { createUserWithRole, removeDuplicatedTeamUsers } = require('./hooks/helpers');
const {
	getBasic,
	extractOne,
	getTeam,
	patchTeam,
	getSessionUser,
	removeInvitedUserByEmail,
	getUpdatedSchoolIdArray,
} = require('./helpers');
const { isArray, isDefined, isUndefined, bsonIdToString } = require('./hooks/collection');
const { ScopePermissionService, ScopeListService } = require('../helpers/scopePermissions');
// const {teamRolesToHook} = require('./hooks');
// todo docs require
const { equal: equalIds } = require('../../helper/compare').ObjectId;

const HOST = Configuration.get('HOST');

const { AdminOverview } = require('./services');

class Get {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	/**
	 * @param {} params
	 */
	find(params) {
		return getSessionUser(this, params).then((sessionUser) => {
			const { email } = sessionUser;
			const restrictedFindMatch = { invitedUserIds: { $elemMatch: { email } } };
			return this.app.service('teams').find({ query: restrictedFindMatch });
		});
	}

	setup(app) {
		this.app = app;
	}
}

/**
 * @attantion Please send no feedback if user is not found!
 */
class Add {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	/**
	 * @private
	 * @return {Promise::bsonId||stringId} Expert school id.
	 */
	_getExpertSchoolId() {
		return this.app
			.service('schools')
			.find({ query: { purpose: 'expert' } })
			.then((schools) => extractOne(schools, '_id').then((id) => bsonIdToString(id)))
			.catch((err) => {
				throw new GeneralError('Experte: Fehler beim Abfragen der Schule.', err);
			});
	}

	/**
	 * @private
	 * @return {Promise::bsonId||stringId} Expert role id.
	 */
	_getExpertRoleId() {
		return this.app
			.service('roles')
			.find({ query: { name: 'expert' } })
			.then((roles) => extractOne(roles, '_id').then((id) => bsonIdToString(id)))
			.catch((err) => {
				throw new GeneralError('Experte: Fehler beim Abfragen der Rolle.', err);
			});
	}

	/**
	 * @private
	 * @param {String} email
	 * @return {Promise::User}
	 */
	async _getUsersByEmail(email) {
		return this.app
			.service('users')
			.find({
				query: {
					email,
					$populate: [{ path: 'roles' }],
				},
			})
			.then((users) => extractOne(users))
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * @private
	 * @param {Object::{esid::String, email::String, teamId::String, importHash::String}} opt
	 * @param {Boolean} isUserCreated default = false
	 */
	async _generateLink({ esid, email, teamId, importHash }, isUserCreated = false) {
		if (isUserCreated === false && isUndefined(importHash)) {
			return Promise.resolve({ shortLink: `${HOST}/teams/${teamId}` });
		}
		const { app } = this;
		if (isDefined(importHash)) {
			const regex = new RegExp(importHash);
			const links = await app.service('link').find({ query: { target: regex } });
			return extractOne(links).then((linkData) => {
				linkData.shortLink = `${HOST}/link/${linkData._id}`;
				return linkData;
			});
		}

		return app
			.service('/expertinvitelink')
			.create({ esid, email })
			.catch((err) => {
				throw new GeneralError('Experte: Fehler beim Erstellen des Einladelinks.', err);
			});
	}

	/**
	 * Use for email invites
	 * @private
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @return {Object::
	 *      schoolId::String,
	 *      isUserCreated::Boolean,
	 *      user::Object::User,
	 *      team::Object::Team,
	 * }}
	 */
	async _collectUserAndLinkData({ email, role, teamId }) {
		return Promise.all([
			// eslint-disable-next-line no-underscore-dangle
			this._getUsersByEmail(email),
			// eslint-disable-next-line no-underscore-dangle
			this._getExpertSchoolId(),
			// eslint-disable-next-line no-underscore-dangle
			this._getExpertRoleId(),
			getTeam(this, teamId),
		])
			.then(async ([user, schoolId, expertRoleId, team]) => {
				let isUserCreated = false;
				let isResend = false;
				let userRoleName;
				if (isUndefined(user) && role === 'teamexpert') {
					const newUser = {
						email,
						schoolId,
						roles: [expertRoleId],
						firstName: 'Experte',
						lastName: 'Experte',
					};
					// eslint-disable-next-line no-param-reassign
					user = await userModel.create(newUser);
					isUserCreated = true;
				}

				if (isUserCreated || isDefined(role)) {
					userRoleName = role;
				} else {
					const teamUser = team.invitedUserIds.find((invited) => invited.email === email);
					isResend = true;
					userRoleName = (teamUser || {}).role || role;
				}

				// if role teamadmin by import from teacher over email and
				// no user exist, the user is undefined
				if (isUndefined(user)) {
					throw new BadRequest('User must exist.');
				}
				if (isUndefined(userRoleName)) {
					throw new BadRequest('For this case the team role for user must be set.');
				}
				return {
					esid: schoolId,
					isUserCreated,
					isResend,
					user,
					team,
					userRoleName,
					importHash: user.importHash,
				};
			})
			.catch((err) => {
				warning(err);
				throw new BadRequest('Can not resolve the user information.');
			});
	}

	/**
	 * Format the response.
	 * @private
	 * @param {Object} opt
	 * @param {Object} opt.linkData
	 * @param {Object} opt.user
	 * @param {Object} [opt.isUserCreated = false]
	 * @param {Object} [opt.isResend = false]
	 * @param {Object} [opt.email]
	 */
	static _response(opt) {
		if (isUndefined([opt.linkData, opt.user], 'OR')) {
			throw new BadRequest('Can not complete the response');
		}
		opt.message = 'Success!';
		opt.isUserCreated = opt.isUserCreated || false;
		opt.isResend = opt.isResend || false;
		return opt;
	}

	/**
	 * @private
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @param {Object::params} params The request params.
	 * @return {Promise::{
	 * message: 'Success!',
	 * linkData::Object~from this._generateLink(),
	 * user::Object::User,
	 * role::String
	 * }}
	 */
	async _userImportById(teamId, { userId, role }, params) {
		const [ref, user, team] = await getBasic(this, teamId, params, userId);
		const { schoolId } = user;
		const schoolIds = getUpdatedSchoolIdArray(team, user);
		let { userIds } = team;
		userIds.push(createUserWithRole(ref, { userId, selectedRole: role, schoolId }));
		userIds = removeDuplicatedTeamUsers(userIds);

		return Promise.all([
			// eslint-disable-next-line no-underscore-dangle
			this._generateLink({ teamId }, false),
			patchTeam(this, teamId, { userIds, schoolIds }, params),
			// eslint-disable-next-line no-underscore-dangle
		]).then(([linkData]) => Add._response({ linkData, user }));
	}

	/**
	 * @private
	 * @param {Obejct::team.userIds} {userIds} The userIds *must* be *popluated*
	 * @throws if user already inside this team
	 */
	static _throwErrorIfUserExistByEmail({ userIds }, email) {
		if (!isArray(userIds)) {
			throw new BadRequest('Wrong input.');
		}
		if (userIds.length === 0) {
			return true;
		}
		if (isUndefined(userIds[0].userId.email)) {
			throw new BadRequest('UserIds must be populated.');
		}
		if (userIds.some((user) => user.userId.email === email)) {
			throw new BadRequest('User already inside the team.');
		}
		return true;
	}

	/**
	 * The schoolIds for new added users will not updated inside this step.
	 * It will manage if the user accpet the invite.
	 * @private
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @param {Object::params} params The request params.
	 * @return {Promise::{
	 *      message: 'Success!',
	 *      linkData::Object~from this._generateLink(),
	 *      user::Object::User,
	 *      role::String
	 * }}
	 */
	async _userImportByEmail(teamId, { email, role }, params) {
		// let { email, role } = data;
		// eslint-disable-next-line no-param-reassign
		email = email.toLowerCase(); // important for valid user
		const {
			esid,
			isUserCreated,
			isResend,
			user,
			team,
			userRoleName,
			importHash,
			// eslint-disable-next-line no-underscore-dangle
		} = await this._collectUserAndLinkData({ email, role, teamId });
		const { invitedUserIds } = team;
		// eslint-disable-next-line no-param-reassign
		role = userRoleName; /*
            @override
            is important if user already in invited users exist and the role is take from team
        */

		// eslint-disable-next-line no-underscore-dangle
		Add._throwErrorIfUserExistByEmail(team, email);

		// if not already in invite list
		if (!invitedUserIds.some((teamUser) => teamUser.email === email)) {
			invitedUserIds.push({ email, role });
		}
		return Promise.all([
			// eslint-disable-next-line no-underscore-dangle
			this._generateLink(
				{
					esid,
					email,
					teamId,
					importHash,
				},
				isUserCreated
			),
			patchTeam(this, teamId, { invitedUserIds }, params),
			// eslint-disable-next-line no-underscore-dangle
		]).then(([linkData]) =>
			Add._response({
				linkData,
				user,
				isUserCreated,
				isResend,
				email,
			})
		);
	}

	/**
	 * @param {String} teamId
	 * @param {Object::{email::String, userId::String, role::String}} data
	 * @param {Object::params} params The request params.
	 */
	patch(teamId, data, params) {
		try {
			if (isDefined(data.role) && ['teamexpert', 'teamadministrator'].includes(data.role) === false) {
				throw new BadRequest('Wrong role is set.');
			}
			let out;
			if (data.email) {
				// eslint-disable-next-line no-underscore-dangle
				out = this._userImportByEmail(teamId, data, params);
			} else if (data.userId && data.role) {
				// eslint-disable-next-line no-underscore-dangle
				out = this._userImportById(teamId, data, params);
			} else {
				throw new BadRequest('Missing input data.');
			}
			return out;
		} catch (err) {
			warning(err);
			return Promise.resolve({ message: 'Success!' });
		}
	}

	setup(app) {
		this.app = app;
	}
}
/**
 * Accept the team invite
 */
class Accept {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
		//  this.app = options.app;
	}

	static findInvitedUserByEmail(team, email) {
		return team.invitedUserIds.find((element) => element.email === email);
	}

	/**
	 * @param {*} id
	 * @param {*} params
	 */
	get(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { email, schoolId } = sessionUser;
			const userId = bsonIdToString(sessionUser._id);
			let { invitedUserIds } = team;
			const { userIds } = team;

			const invitedUser = Accept.findInvitedUserByEmail(team, email);
			if (isUndefined(invitedUser)) {
				throw new NotFound('User is not in this team.');
			}
			const role = ref.findRole('name', invitedUser.role, '_id');
			userIds.push({ userId, role, schoolId });

			invitedUserIds = removeInvitedUserByEmail(team, email);

			const schoolIds = getUpdatedSchoolIdArray(team, sessionUser);
			const accept = { userId, teamId };

			return patchTeam(
				this,
				teamId,
				{
					invitedUserIds,
					userIds,
					schoolIds,
					accept,
				},
				params
			);
		});
	}

	setup(app) {
		this.app = app;
	}
}

/**
 * Remove from invite list
 */
class Remove {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
		//  this.app = options.app;
	}

	/**
	 * @param {*} id
	 * @param {*} data
	 * @param {*} params
	 */
	patch(teamId, { email }, params) {
		if (isUndefined(email)) {
			throw new BadRequest('Missing parameter.');
		}
		return getTeam(this, teamId).then((team) => {
			const invitedUserIds = removeInvitedUserByEmail(team, email);
			return patchTeam(this, teamId, { invitedUserIds }, params);
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function setup() {
	const app = this;
	const options = {
		Model: teamsModel,
		paginate: {
			default: 50,
			max: 100,
		},
		lean: { virtuals: true },
		multi: true,
	};

	app.use('/teams/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/teams', service(options));
	app.use('/teams/extern/get', new Get());
	app.use('/teams/extern/add', new Add());
	app.use('/teams/extern/accept', new Accept());
	app.use('/teams/extern/remove', new Remove());

	const teamsServices = app.service('/teams');
	const topLevelServices = {
		get: app.service('/teams/extern/get'),
		add: app.service('/teams/extern/add'),
		accept: app.service('/teams/extern/accept'),
		remove: app.service('/teams/extern/remove'),
	};

	teamsServices.hooks({
		before: hooks.before,
		after: hooks.after,
	});

	Object.values(topLevelServices).forEach((_service) => {
		_service.hooks({
			before: hooks.beforeExtern,
			after: hooks.afterExtern,
		});
	});

	app.use('/teams/manage/admin', new AdminOverview());
	const teamsAdmin = app.service('/teams/manage/admin');
	teamsAdmin.hooks({
		before: hooks.beforeAdmin,
		after: hooks.afterAdmin,
	});

	ScopePermissionService.initialize(app, '/teams/:scopeId/userPermissions', async (userId, team) => {
		// Return all permissions of the user's team role within the given team
		const [teamUser] = team.userIds.filter((u) => equalIds(u.userId, userId));
		if (teamUser !== undefined) {
			const role = await app.service('roles').get(teamUser.role.toString());
			return role.permissions;
		}
		return [];
	});

	ScopeListService.initialize(app, '/users/:scopeId/teams', async (user, permissions) => {
		// Find all teams the user is in, regardless of permissions
		const query = {
			'userIds.userId': user._id,
		};
		const result = await app.service('teams').find({ query });
		// Permissions can only be checked via a lookup in the Role service,
		// because permissions can be inherited from parent-roles and are only decorated
		// into the role with an after-hook.
		// We need to use map+filter here, because the role-lookup is async and cannot
		// be handled by array#filter (which is inherently synchronous) alone.
		const teams = (
			await Promise.all(
				result.data.map(async (t) => {
					const [u] = t.userIds.filter((i) => equalIds(i.userId, user._id));
					if (!u.role) return false;
					const role = await app.service('roles').get(u.role);
					return permissions.every((p) => role.permissions.includes(p)) ? t : undefined;
				})
			)
		).filter((e) => e);
		return teams;
	});
};
