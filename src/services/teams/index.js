'use strict';

const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const logger = require('winston');
//const globalHooks = require('../../hooks');
const hooks = require('./hooks');
const { teamsModel } = require('./model');
const { userModel } = require('../user/model');
const H = require('./hooks/helpers');
const {
	getBasic,
	extractOne,
	getTeam,
	patchTeam,
	getSessionUser,
	removeInvitedUserByEmail,
	getUpdatedSchoolIdArray
} = require('./helpers');
const {
	isArray,
	isArrayWithElement,
	isString,
	isDefined,
	isUndefined,
	bsonIdToString,
	isSameId
} = require('./hooks/collection');
//const {teamRolesToHook} = require('./hooks');
//todo docs require 

class AdminOverview {
	constructor(options) {
		this.options = options || {};
		this.docs = {};

		if (process.env.SC_SHORT_TITLE === undefined)
			throw new errors.NotAcceptable('SC_SHORT_TITLE is not defined.');
	}

	testIfUserByRoleExist(team, roleId) {
		return team.userIds.some(user => isSameId(user.role, roleId));
	}

	removeMemberBySchool(team, schoolId) {
		return team.userIds.filter(user => !isSameId(user.schoolId, schoolId));
	}

	getMembersBySchool(team, schoolId) {
		return team.userIds.filter(user => isSameId(user.schoolId, schoolId));
	}

	getIsOwnerStats(ref, sessionUser, team) {
		const selectedRole = ref.findRole('name', 'teamowner', '_id');
		const ownerExist = this.testIfUserByRoleExist(team, selectedRole);
		const schoolId = sessionUser.schoolId;
		const isOwnerSchool = isSameId(schoolId, team.schoolId);
		return { ownerExist, isOwnerSchool, schoolId, selectedRole };
	}

	getKeys(obj, keys) {
		return keys.reduce((newObj, key) => {
			newObj[key] = obj[key];
			return newObj;
		}, {});
	}

	mapped(teams, sessionSchoolId) {
		return teams.data.map(team => {
			const mySchool = isSameId(team.schoolId, sessionSchoolId);
			const otherSchools = team.schoolIds.length > 1;
			let schoolMembers = this.getMembersBySchool(team, sessionSchoolId);
			const ownerExist = team.userIds.some(user => user.role.name === 'teamowner');	//role is populated

			schoolMembers = schoolMembers.map(m => {
				return {
					role: m.role.name,
					user: this.getKeys(m.userId, ['roles', '_id', 'firstName', 'lastName'])
				};
			});

			schoolMembers = schoolMembers.map(m => {
				m.user.roles = (m.user.roles || []).map(role => {
					return role.name;
				});
				return m;
			});

			return {
				//todo ownerExist -> ref role needed
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
				schools: team.schoolIds.map(s => this.getKeys(s, ['name', '_id'])),
				schoolMembers
			};
		});
	}

	find(params) {
		return getSessionUser(this, params).then(sessionUser => {
			const schoolId = sessionUser.schoolId;
			return this.app.service('teams').find({
				query: {
					schoolIds: schoolId,
					//userIds: { $elemMatch: { schoolId } },
					$populate: [{ path: 'userIds.role' }, { path: 'userIds.userId', populate: { path: 'roles' } }, 'schoolIds'] 	//schoolId
				}
			}).then(teams => {
				return this.mapped(teams, schoolId);
			}).catch(err => {
				throw new errors.BadRequest('Can not execute team find.', err);
			});
		});
	}

	/**
	 * If team is create at this school and owner if not exist, 
	 * the school admin can set a new owner for this team.
	 * If school is created from other school and *userId is not set*, it remove all users from own school.
	 * @param {String} teamId 
	 * @param {Object} data data.userId 
	 * @param {Object} params 
	 */
	patch(teamId, { userId }, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { ownerExist, isOwnerSchool, selectedRole, schoolId } = this.getIsOwnerStats(ref, sessionUser, team);
			//const userId = data.userId;
			let userIds = team.userIds;

			if (!ownerExist && isOwnerSchool && isDefined(userId)) {
				userIds.push(H.createUserWithRole(ref, { userId, schoolId, selectedRole }));
				return patchTeam(this, teamId, { userIds }, params);
			} else if (!isOwnerSchool && isUndefined(userId)) {
				userIds = this.removeMemberBySchool(team, schoolId);
				patchTeam(this, teamId, { userIds }, params);
			} else {
				throw new errors.BadRequest('Wrong inputs.');
			}
		});
	}

	/**
	 * If team is created at own school, it remove it.
	 * @param {*} teamId 
	 * @param {*} params 
	 */
	remove(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { isOwnerSchool } = this.getIsOwnerStats(ref, sessionUser, team);
			if (isOwnerSchool) {
				return this.app.service('teams').remove(teamId);
			} else {
				throw new errors.Forbidden('You have not the permission.');
			}
		});
	}


	/**********************
	 * Contact Owner part *
	 **********************/

	getOwner(team, ownerRoleId) {
		return team.userIds.find(user => isSameId(user.role, ownerRoleId));
	}

	formatText(text) {
		//todo
		return text;
	}

	getRestrictedQuery(teamIds, schoolId) {
		let query = teamIds.map(_id => {
			return { _id };
		});
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

		if (isUndefined([teamIds, message], 'OR'))
			throw new errors.BadRequest('Missing parameter');

		if (!isArray(teamIds))
			teamIds = [teamIds];

		if (teamIds.length <= 0 || !isString(message))
			throw new errors.BadRequest('Wrong value.');


		return Promise.all([getSessionUser(this, params), hooks.teamRolesToHook(this)]).then(([{ schoolId }, ref]) => {
			return this.app.service('teams').find((this.getRestrictedQuery(teamIds, schoolId))).then(teams => {
				teams = teams.data;
				if (!isArrayWithElement(teams))
					throw new errors('No team found.');

				const subject = `${process.env.SC_SHORT_TITLE}: Team-Anfrage`;
				const mailService = this.app.service('/mails');
				const ownerRoleId = ref.findRole('name', 'teamowner', '_id');
				const emails = teams.reduce((stack, team) => {
					const owner = this.getOwner(team, ownerRoleId);
					if (isDefined(owner.userId.email))
						stack.push(owner.userId.email);
					return stack;
				}, []);
				const content = {
					"text": this.formatText(message) || "No alternative mailtext provided. Expected: HTML Template Mail.",
					"html": ""
				};

				const waits = emails.map(email => {
					return mailService.create({ email, subject, content }).then(res => {
						return res.accepted[0];
					}).catch(err => {
						return 'Error: ' + err.message;
					});
				});

				return Promise.all(waits).then(values => {
					return values;
				}).catch(err => {
					return err;
				});

			}).catch(err => {
				throw err;
			});
		}).catch(err => {
			logger.warn(err);
			throw new errors.BadRequest('It exists no teams with access rights, to send this message.');
		});
	}

	setup(app, path) {
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
		return getSessionUser(this, params).then(sessionUser => {
			const email = sessionUser.email;
			const restrictedFindMatch = { invitedUserIds: { $elemMatch: { email } } };
			return this.app.service('teams').find({ query: restrictedFindMatch });
		});
	}

	setup(app, path) {
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
	 * @return {Promise::bsonId||stringId} Expert school id.
	 */
	getExpertSchoolId() {
		return this.app.service('schools').find({ query: { purpose: "expert" } }).then(schools => {
			return extractOne(schools, '_id').then(id => {
				return bsonIdToString(id);
			});
		}).catch(err => {
			throw new errors.GeneralError("Experte: Fehler beim Abfragen der Schule.", err);
		});
	}

	/**
	 * @return {Promise::bsonId||stringId} Expert role id.
	 */
	getExpertRoleId() {
		return this.app.service('roles').find({ query: { name: "expert" } }).then(roles => {
			return extractOne(roles, '_id').then(id => {
				return bsonIdToString(id);
			});
		}).catch(err => {
			throw new errors.GeneralError("Experte: Fehler beim Abfragen der Rolle.", err);
		});
	}

	/**
	 * @param {String} email 
	 * @return {Promise::User}
	 */
	async getUsersByEmail(email) {
		return this.app.service('users').find({ query: { email } }).then(users => {
			return extractOne(users);
		}).catch(err => {
			throw err;
		});
	}

	/**
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 */
	async generateLink({ esid, email, teamId }, isUserCreated) {
		if (isUserCreated === false) {
			return Promise.resolve({ shortLink: process.env.HOST + '/teams/' + teamId });
		} else {
			return this.app.service('/expertinvitelink').create({ esid, email }).catch(err => {
				throw new errors.GeneralError("Experte: Fehler beim Erstellen des Einladelinks.", err);
			});
		}
	}

	/**
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @return {Object::{ schoolId::String, isUserCreated::Boolean, user::Object::User, team::Object::Team }}
	 */
	async createUserAndReturnLinkData({ email, role, teamId }) {
		return Promise.all([
			this.getUsersByEmail(email),
			this.getExpertSchoolId(),
			this.getExpertRoleId(),
			getTeam(this, teamId)
		]).then(async ([user, schoolId, expertRoleId, team]) => {
			let isUserCreated = false;
			if (isUndefined(user) && role === 'teamexpert') {
				const newUser = { email, schoolId, roles: [expertRoleId], firstName: "Experte", lastName: "Experte" };
				user = await userModel.create(newUser);
				isUserCreated = true;
			}
			return { schoolId, isUserCreated, user, team };
		}).catch(err => {
			throw new errors.GeneralError("Experte: Fehler beim Erstellen des Experten.", err);
		});
	}

	/**
	 * Format the response. 
	 * @param {Object::{ linkData, user, role }} opt
	 */
	response({ linkData, user, role }) {
		if (isUndefined([linkData, user, role], 'OR'))
			throw new errors.BadRequest('Can not complete the response');
		return { message: 'Success!', linkData, user, role };
	}

	/**
	 * @param {Object::{user, role}} opt 
	 * @param {String} teamId 
	 * @return this.response() formated 
	 */
	getExistingInviteLink({ user, role }, teamId) {
		if (isDefined(user.importHash)) {
			const regex = new RegExp(user.importHash);
			return this.app.service('link').find({ query: { target: regex } }).then(links => {
				return extractOne(links).then(linkData => {
					return this.response({ linkData, user, role });
				});
			});
		} else {
			return this.generateLink({ teamId }, false).then(linkData => {
				return this.response({ linkData, user, role });
			});
		}
	}

	/**
	 * Test if email already added and user exist.
	 * @param {Array} invitedUserIds 
	 * @param {String} email 
	 * @param {Object::User} user 
	 */
	isResendInvitation(invitedUserIds, email, user) {
		return invitedUserIds.some(teamUser => teamUser.email === email) && isDefined(user);
	}

	/**
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @param {Object::params} params The request params.
	 * @return {Promise::{ message: 'Success!', linkData::Object~from this.generateLink(), user::Object::User, role::String }}
	 */
	async userImportById({ teamId, userId, role }, params) {
		const [ref, user, team] = await getBasic(this, teamId, params, userId);
		const schoolId = user.schoolId;
		const schoolIds = getUpdatedSchoolIdArray(team, user);
		let userIds = team.userIds;
		userIds.push(H.createUserWithRole(ref, { userId, selectedRole: role, schoolId }));
		userIds = H.removeDuplicatedTeamUsers(userIds);

		return Promise.all([this.generateLink({ teamId }, false), patchTeam(this, teamId, { userIds, schoolIds }, params)]).then(([linkData, _]) => {
			return this.response({ linkData, user, role });
		});
	}

	/**
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @param {Object::params} params The request params.
	 * @return {Promise::{ message: 'Success!', linkData::Object~from this.generateLink(), user::Object::User, role::String }}
	 */
	async userImportByEmail({ teamId, email, role }, params) {
		const { schoolId, isUserCreated, user, team } = await this.createUserAndReturnLinkData({ email, role, teamId });
		let invitedUserIds = team.invitedUserIds;
		if (this.isResendInvitation(invitedUserIds, email, user)) {
			return this.getExistingInviteLink({ user, role }, teamId);
		} else {
			invitedUserIds.push({ email, role });
			return Promise.all([this.generateLink({ esid: schoolId, email, teamId }, isUserCreated), patchTeam(this, teamId, { invitedUserIds }, params)]).then(([linkData, _]) => {
				return this.response({ linkData, user, role });
			});
		}
	}

	/**
	 * @param {String} teamId 
	 * @param {Object::{email::String, userId::String, role::String}} data 
	 * @param {Object::params} params The request params.
	 */
	async patch(teamId, { email, userId, role }, params) {
		try {
			if (['teamexpert', 'teamadministrator'].includes(role) === false)
				throw 'Experte: Wrong role is set.';

			if (email && role)
				return this.userImportByEmail({ email, role, teamId }, params);
			else if (userId && role)
				return this.userImportById({ teamId, userId, role }, params);
			else
				throw new errors.BadRequest('Missing input data.');

		} catch (err) {
			logger.warn(err);
			return Promise.resolve('Success!');
		}
	}

	setup(app, path) {
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

	findInvitedUserByEmail(team, email) {
		return team.invitedUserIds.find(element => element.email === email);
	}
	/**
	 * @param {*} id 
	 * @param {*} params 
	 */
	get(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const email = sessionUser.email;
			const userId = bsonIdToString(sessionUser._id);
			let invitedUserIds = team.invitedUserIds;
			let userIds = team.userIds;

			const invitedUser = this.findInvitedUserByEmail(team, email);
			if (isUndefined(invitedUser))
				throw new errors.NotFound('User is not in this team.');

			const role = ref.findRole('name', invitedUser.role, '_id');
			userIds.push({ userId, role });

			invitedUserIds = removeInvitedUserByEmail(team, email);

			const schoolIds = getUpdatedSchoolIdArray(team, sessionUser);
			const accept = { userId, teamId };

			return patchTeam(this, teamId, { invitedUserIds, userIds, schoolIds, accept }, params);
		});
	}

	setup(app, path) {
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
		if (isUndefined(email))
			throw new errors.BadRequest('Missing parameter.');

		return getTeam(this, teamId).then(team => {
			let invitedUserIds = removeInvitedUserByEmail(team, email);
			return patchTeam(this, teamId, { invitedUserIds }, params);
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;
	const options = {
		Model: teamsModel,
		paginate: {
			default: 2,
			max: 100
		},
		lean: true
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
		remove: app.service('/teams/extern/remove')
	};

	teamsServices.before(hooks.before);
	teamsServices.after(hooks.after);

	Object.values(topLevelServices).forEach(_service => {
		_service.before(hooks.beforeExtern);
		_service.after(hooks.afterExtern);
	});

	app.use('/teams/manage/admin', new AdminOverview());
	const teamsAdmin = app.service('/teams/manage/admin');
	teamsAdmin.before(hooks.beforeAdmin);
	teamsAdmin.after(hooks.afterAdmin);
};
