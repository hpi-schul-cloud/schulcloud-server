const service = require('feathers-mongoose');
const {
	BadRequest,
	Forbidden,
	GeneralError,
	NotFound,
} = require('@feathersjs/errors');
const hooks = require('./hooks');
const { warn } = require('../../logger/index');
const { teamsModel } = require('./model');
const { userModel } = require('../user/model');
const {
	createUserWithRole,
	removeDuplicatedTeamUsers,
} = require('./hooks/helpers');
const {
	getBasic,
	extractOne,
	getTeam,
	patchTeam,
	getSessionUser,
	removeInvitedUserByEmail,
	getUpdatedSchoolIdArray,
} = require('./helpers');
const {
	isArray,
	isArrayWithElement,
	isString,
	isDefined,
	isUndefined,
	bsonIdToString,
	isSameId,
} = require('./hooks/collection');
const scopePermissionsHooks = require('./hooks/scopePermissions');
// const {teamRolesToHook} = require('./hooks');
// todo docs require

class AdminOverview {
	constructor(options) {
		this.options = options || {};
		this.docs = {};

		if (process.env.SC_SHORT_TITLE === undefined) {
			warn('SC_SHORT_TITLE is not defined.');
		}
	}

	static testIfUserByRoleExist(team, roleId) {
		return team.userIds.some(user => isSameId(user.role, roleId));
	}

	static removeMemberBySchool(team, schoolId) {
		return team.userIds.filter(user => !isSameId(user.schoolId, schoolId));
	}

	static getMembersBySchool(team, schoolId) {
		return team.userIds.filter(user => isSameId(user.schoolId, schoolId));
	}

	static getIsOwnerStats(ref, sessionUser, team) {
		const selectedRole = ref.findRole('name', 'teamowner', '_id');
		const ownerExist = AdminOverview.testIfUserByRoleExist(team, selectedRole);
		const { schoolId } = sessionUser;
		const isOwnerSchool = isSameId(schoolId, team.schoolId);
		return {
			ownerExist,
			isOwnerSchool,
			schoolId,
			selectedRole,
		};
	}

	static getKeys(obj, keys) {
		return keys.reduce((newObj, key) => {
			newObj[key] = obj[key];
			return newObj;
		}, {});
	}

	static mapped(teams, sessionSchoolId) {
		return teams.data.map((team) => {
			const mySchool = isSameId(team.schoolId, sessionSchoolId);
			const otherSchools = team.schoolIds.length > 1;
			let schoolMembers = AdminOverview.getMembersBySchool(team, sessionSchoolId);
			const ownerExist = team.userIds.some(user => user.role.name === 'teamowner');	// role is populated

			schoolMembers = schoolMembers.map((m) => {
				const obj = {
					role: m.role.name,
					user: AdminOverview.getKeys(m.userId, ['roles', '_id', 'firstName', 'lastName']),
				};
				return obj;
			});

			schoolMembers = schoolMembers.map((m) => {
				m.user.roles = (m.user.roles || []).map(role => role.name);
				return m;
			});

			return {
				// todo ownerExist -> ref role needed
				membersTotal: team.userIds.length,
				name: team.name,
				_id: team._id,
				color: team.color,
				desciption: team.desciption,
				mySchool,
				otherSchools,
				createdAt: team.createdAt,
				ownerExist,
				//		ownerSchool:team.schoolId.name,
				schools: team.schoolIds.map(s => AdminOverview.getKeys(s, ['name', '_id'])),
				schoolMembers,
			};
		});
	}

	find(params) {
		return getSessionUser(this, params).then((sessionUser) => {
			const { schoolId } = sessionUser;
			return this.app.service('teams').find({
				query: {
					schoolIds: schoolId,
					// userIds: { $elemMatch: { schoolId } },
					$populate: [{ path: 'userIds.role' }, {
						path: 'userIds.userId',
						populate: { path: 'roles' },
					}, 'schoolIds'], 	// schoolId
				},
			})
				.then(teams => AdminOverview.mapped(teams, schoolId))
				.catch((err) => {
					throw new BadRequest('Can not execute team find.', err);
				});
		});
	}

	/**
	 * If team is create at this school and owner if not exist,
	 * the school admin can set a new owner for this team.
	 * If school is created from other school and *userId is not set*,
	 * it remove all users from own school.
	 * @param {String} teamId
	 * @param {Object} data data.userId
	 * @param {Object} params
	 */
	patch(teamId, { userId }, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const {
				ownerExist,
				isOwnerSchool,
				selectedRole,
				schoolId,
			} = AdminOverview.getIsOwnerStats(ref, sessionUser, team);
			// const userId = data.userId;
			let { userIds } = team;

			if (!ownerExist && isOwnerSchool && isDefined(userId)) {
				userIds.push(createUserWithRole(ref, { userId, schoolId, selectedRole }));
			} else if (!isOwnerSchool && isUndefined(userId)) {
				userIds = AdminOverview.removeMemberBySchool(team, schoolId);
			} else {
				throw new BadRequest('Wrong inputs.');
			}

			return patchTeam(this, teamId, { userIds }, params);
		});
	}

	/**
	 * If team is created at own school, it remove it.
	 * @param {*} teamId
	 * @param {*} params
	 */
	remove(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { isOwnerSchool } = AdminOverview.getIsOwnerStats(ref, sessionUser, team);
			if (isUndefined(isOwnerSchool)) {
				throw new Forbidden('You have not the permission.');
			}
			return this.app.service('teams').remove(teamId);
		});
	}


	/**
	* Contact Owner part
	*/

	static getOwner(team, ownerRoleId) {
		return team.userIds.find(user => isSameId(user.role, ownerRoleId));
	}

	static formatText(text) {
		// todo
		return text;
	}

	static getRestrictedQuery(teamIds, schoolId) {
		let query = teamIds.map(_id => ({ _id }));
		query = { $or: query, $populate: [{ path: 'userIds.userId' }] };
		query.schoolIds = schoolId;
		return { query };
	}

	/**
	 * Over this services method can administrators can send message for school teams.
	 * It has a batch logic to send the same message to different teams.
	 * This message contact the owner of this teams over his email.
	 * @param {Object::{message:String,teamIds:String||Array::String}} data
	 * @param {*} params
	 */
	create({ message, teamIds }, params) {
		//	const message = data.message;
		//	let teamIds = data.teamIds;

		if (isUndefined([teamIds, message], 'OR')) {
			throw new BadRequest('Missing parameter');
		}
		if (!isArray(teamIds)) {
			// eslint-disable-next-line no-param-reassign
			teamIds = [teamIds];
		}
		if (teamIds.length <= 0 || !isString(message)) {
			throw new BadRequest('Wrong value.');
		}

		return Promise.all(
			[getSessionUser(this, params), hooks.teamRolesToHook(this)],
		).then(([{ schoolId }, ref]) => this.app.service('teams')
			.find((this.getRestrictedQuery(teamIds, schoolId))).then((teams) => {
				// eslint-disable-next-line no-param-reassign
				teams = teams.data;
				if (!isArrayWithElement(teams)) {
					throw new NotFound('No team found.');
				}

				const subject = `${process.env.SC_SHORT_TITLE}: Team-Anfrage`;
				const mailService = this.app.service('/mails');
				const ownerRoleId = ref.findRole('name', 'teamowner', '_id');
				const emails = teams.reduce((stack, team) => {
					const owner = AdminOverview.getOwner(team, ownerRoleId);
					if (isDefined(owner.userId.email)) {
						stack.push(owner.userId.email);
					}
					return stack;
				}, []);
				const content = {
					text: this.formatText(message) || 'No alternative mailtext provided. Expected: HTML Template Mail.',
					html: '',
				};

				const waits = emails.map(email => mailService.create({ email, subject, content })
					.then(res => res.accepted[0])
					.catch(err => `Error: ${err.message}`));

				return Promise.all(waits)
					.then(values => values)
					.catch(err => err);
			}).catch((err) => {
				throw err;
			})).catch((err) => {
			warn(err);
			throw new BadRequest('It exists no teams with access rights, to send this message.');
		});
	}

	setup(app) {
		this.app = app;
	}
}

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
		return this.app.service('schools').find({ query: { purpose: 'expert' } })
			.then(schools => extractOne(schools, '_id')
				.then(id => bsonIdToString(id)))
			.catch((err) => {
				throw new GeneralError('Experte: Fehler beim Abfragen der Schule.', err);
			});
	}

	/**
	 * @private
	 * @return {Promise::bsonId||stringId} Expert role id.
	 */
	_getExpertRoleId() {
		return this.app.service('roles')
			.find({ query: { name: 'expert' } })
			.then(roles => extractOne(roles, '_id')
				.then(id => bsonIdToString(id)))
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
		return this.app.service('users').find({
			query: {
				email,
				$populate: [{ path: 'roles' }],
			},
		})
			.then(users => extractOne(users))
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * @private
	 * @param {Object::{esid::String, email::String, teamId::String, importHash::String}} opt
	 * @param {Boolean} isUserCreated default = false
	 */
	async _generateLink({
		esid, email, teamId, importHash,
	}, isUserCreated = false) {
		if (isUserCreated === false && isUndefined(importHash)) {
			return Promise.resolve({ shortLink: `${process.env.HOST}/teams/${teamId}` });
		}
		const { app } = this;
		if (isDefined(importHash)) {
			const regex = new RegExp(importHash);
			const links = await app.service('link').find({ query: { target: regex } });
			return extractOne(links).then((linkData) => {
				linkData.shortLink = `${process.env.HOST}/link/${linkData._id}`;
				return linkData;
			});
		}

		return app.service('/expertinvitelink')
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
	 * 		schoolId::String,
	 * 		isUserCreated::Boolean,
	 * 		user::Object::User,
	 * 		team::Object::Team,
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
		]).then(async ([user, schoolId, expertRoleId, team]) => {
			let isUserCreated = false;
			let isResend = false;
			let userRoleName;
			if (isUndefined(user) && role === 'teamexpert') {
				const newUser = {
					email, schoolId, roles: [expertRoleId], firstName: 'Experte', lastName: 'Experte',
				};
				// eslint-disable-next-line no-param-reassign
				user = await userModel.create(newUser);
				isUserCreated = true;
			}

			if (isUserCreated || isDefined(role)) {
				userRoleName = role;
			} else {
				const teamUser = team.invitedUserIds.find(invited => invited.email === email);
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
		}).catch((err) => {
			warn(err);
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
		//	const { userId, role } = data;
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
		if (userIds.some(user => user.userId.email === email)) {
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
	 *  	message: 'Success!',
	 * 		linkData::Object~from this._generateLink(),
	 * 		user::Object::User,
	 * 		role::String
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
		if (!invitedUserIds.some(teamUser => teamUser.email === email)) {
			invitedUserIds.push({ email, role });
		}
		return Promise.all([
			// eslint-disable-next-line no-underscore-dangle
			this._generateLink({
				esid, email, teamId, importHash,
			}, isUserCreated),
			patchTeam(this, teamId, { invitedUserIds }, params),
			// eslint-disable-next-line no-underscore-dangle
		]).then(([linkData]) => Add._response({
			linkData, user, isUserCreated, isResend, email,
		}));
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
			warn(err);
			return Promise.resolve('Success!');
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
		//	this.app = options.app;
	}

	static findInvitedUserByEmail(team, email) {
		return team.invitedUserIds.find(element => element.email === email);
	}

	/**
	 * @param {*} id
	 * @param {*} params
	 */
	get(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { email } = sessionUser;
			const userId = bsonIdToString(sessionUser._id);
			let { invitedUserIds } = team;
			const { userIds } = team;

			const invitedUser = Accept.findInvitedUserByEmail(team, email);
			if (isUndefined(invitedUser)) {
				throw new NotFound('User is not in this team.');
			}
			const role = ref.findRole('name', invitedUser.role, '_id');
			userIds.push({ userId, role });

			invitedUserIds = removeInvitedUserByEmail(team, email);

			const schoolIds = getUpdatedSchoolIdArray(team, sessionUser);
			const accept = { userId, teamId };

			return patchTeam(this, teamId, {
				invitedUserIds, userIds, schoolIds, accept,
			}, params);
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
		//	this.app = options.app;
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

class ScopePermissionService {
	get(userId, params) {
		return Promise.resolve();
	}

	find(params) {
		return Promise.resolve();
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
	};

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

	app.use('/teams/:scopeId/userPermissions', new ScopePermissionService());
	const scopePermissionService = app.service('/teams/:scopeId/userPermissions');
	scopePermissionService.hooks(scopePermissionsHooks.hooks);
};
