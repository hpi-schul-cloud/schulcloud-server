'use strict';

const service = require('feathers-mongoose');
const hooks = require('./hooks');
const { BadRequest, NotAcceptable, Forbidden, GeneralError, NotFound } = require('feathers-errors');
const { warn } = require('../../logger/index');
//const globalHooks = require('../../hooks');
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
//const {teamRolesToHook} = require('./hooks');
//todo docs require 

class AdminOverview {
	constructor(options) {
		this.options = options || {};
		this.docs = {};

		if (process.env.SC_SHORT_TITLE === undefined)
			throw new NotAcceptable('SC_SHORT_TITLE is not defined.');
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
				schoolMembers,
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
				throw new BadRequest('Can not execute team find.', err);
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
				userIds.push(createUserWithRole(ref, { userId, schoolId, selectedRole }));
				return patchTeam(this, teamId, { userIds }, params);
			} else if (!isOwnerSchool && isUndefined(userId)) {
				userIds = this.removeMemberBySchool(team, schoolId);
				patchTeam(this, teamId, { userIds }, params);
			} else {
				throw new BadRequest('Wrong inputs.');
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
				throw new Forbidden('You have not the permission.');
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
			throw new BadRequest('Missing parameter');

		if (!isArray(teamIds))
			teamIds = [teamIds];

		if (teamIds.length <= 0 || !isString(message))
			throw new BadRequest('Wrong value.');


		return Promise.all([getSessionUser(this, params), hooks.teamRolesToHook(this)]).then(([{ schoolId }, ref]) => {
			return this.app.service('teams').find((this.getRestrictedQuery(teamIds, schoolId))).then(teams => {
				teams = teams.data;
				if (!isArrayWithElement(teams))
					throw new NotFound('No team found.');

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
			warn(err);
			throw new BadRequest('It exists no teams with access rights, to send this message.');
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
	 * @private
	 * @return {Promise::bsonId||stringId} Expert school id.
	 */
	_getExpertSchoolId() {
		return this.app.service('schools').find({ query: { purpose: "expert" } }).then(schools => {
			return extractOne(schools, '_id').then(id => {
				return bsonIdToString(id);
			});
		}).catch(err => {
			throw new GeneralError("Experte: Fehler beim Abfragen der Schule.", err);
		});
	}

	/**
	 * @private
	 * @return {Promise::bsonId||stringId} Expert role id.
	 */
	_getExpertRoleId() {
		return this.app.service('roles').find({ query: { name: "expert" } }).then(roles => {
			return extractOne(roles, '_id').then(id => {
				return bsonIdToString(id);
			});
		}).catch(err => {
			throw new GeneralError("Experte: Fehler beim Abfragen der Rolle.", err);
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
				$populate: [{ path: 'roles' }]
			}
		}).then(users => {
			return extractOne(users);
		}).catch(err => {
			throw err;
		});
	}

	/**
	 * @private
	 * @param {Object::{esid::String, email::String, teamId::String, importHash::String}} opt
	 * @param {Boolean} isUserCreated default = false
	 */
	async _generateLink({ esid, email, teamId, importHash }, isUserCreated = false) {
		if (isUserCreated === false && isUndefined(importHash))
			return Promise.resolve({ shortLink: process.env.HOST + '/teams/' + teamId });

		const app = this.app;
		if (isDefined(importHash)) {
			const regex = new RegExp(importHash);
			const links = await app.service('link').find({ query: { target: regex } });
			return extractOne(links).then(linkData=>{
				linkData.shortLink = process.env.HOST + '/link/' + linkData._id;
				return linkData;
			});
		} else {
			return app.service('/expertinvitelink').create({ esid, email }).catch(err => {
				throw new GeneralError("Experte: Fehler beim Erstellen des Einladelinks.", err);
			});
		}
	}

	/**
	 * Use for email invites 
	 * @private
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @return {Object::{ schoolId::String, isUserCreated::Boolean, user::Object::User, team::Object::Team }}
	 */
	async _collectUserAndLinkData({ email, role, teamId }) {
		return Promise.all([
			this._getUsersByEmail(email),
			this._getExpertSchoolId(),
			this._getExpertRoleId(),
			getTeam(this, teamId)
		]).then(async ([user, schoolId, expertRoleId, team]) => {
			let isUserCreated = false, userRoleName;
			if (isUndefined(user) && role === 'teamexpert') {
				const newUser = { email, schoolId, roles: [expertRoleId], firstName: "Experte", lastName: "Experte" };
				user = await userModel.create(newUser);
				isUserCreated = true;
			}

			if (isUserCreated || isDefined(role)) {
				userRoleName = role;
			} else {
				const teamUser = team.invitedUserIds.find(invited => invited.email === email);
				userRoleName = (teamUser||{}).role || role;
			}

			//if role teamadmin by import from teacher over email and no user exist, the user is undefined
			if(isUndefined(user))
				throw new BadRequest('User must exist.');

			if(isUndefined(userRoleName))
				throw new BadRequest('For this case the team role for user must be set.');

			return { esid: schoolId, 
					isUserCreated, 
					user, 
					team, 
					userRoleName, 
					importHash:user.importHash, 	
			};
		}).catch(err => {
			warn(err);
			throw new BadRequest('Can not resolve the user information.');
		});
	}

	/**
	 * Format the response. 
	 * @private
	 * @param {Object::{ linkData, user, role, isUserCreated=false}} opt
	 */
	_response(data) {
		if (isUndefined([data.linkData, data.user, data.role], 'OR'))
			throw new BadRequest('Can not complete the response');

		data.message = 'Success!';
		data.isUserCreated = data.isUserCreated || false;
		return data;
	}

	/**
	 * @private
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @param {Object::params} params The request params.
	 * @return {Promise::{ message: 'Success!', linkData::Object~from this._generateLink(), user::Object::User, role::String }}
	 */
	async _userImportById({ teamId, userId, role }, params) {
		const [ref, user, team] = await getBasic(this, teamId, params, userId);
		const schoolId = user.schoolId;
		const schoolIds = getUpdatedSchoolIdArray(team, user);
		let userIds = team.userIds;
		userIds.push(createUserWithRole(ref, { userId, selectedRole: role, schoolId }));
		userIds = removeDuplicatedTeamUsers(userIds);

		return Promise.all([
			this._generateLink({ teamId }, false), 
			patchTeam(this, teamId, { userIds, schoolIds }, params),
		]).then(([linkData, _]) => {
			return this._response({ linkData, user, role });
		});
	}

	/**
	 * @private
	 * @param {Obejct::team} team 
	 * @throws if user already inside this team
	 */
	_throwErrorIfUserExistByEmail(team,email){
		console.log('todo:',team.userIds);
		/*todo:  userIds.userId must be populate in getTeam 
		search if user already exist
		if( team.userIds.some(teamUser => teamUser.userId.email === email) )
			

		*/
	}

	/**
	 * The schoolIds for new added users will not updated inside this step. It will manage if the user accpet the invite.
	 * @private
	 * @param {Object::{email::String, role::String, teamId::String}} opt
	 * @param {Object::params} params The request params.
	 * @return {Promise::{ message: 'Success!', linkData::Object~from this._generateLink(), user::Object::User, role::String }}
	 */
	async _userImportByEmail({ teamId, email, role }, params) {
		const { esid, 
				isUserCreated, 
				user, 
				team, 
				userRoleName, 
				importHash,
			} = await this._collectUserAndLinkData({ email, role, teamId });
		const invitedUserIds = team.invitedUserIds;
		role = userRoleName; /**@override**/ //is important if user already in invited users exist and the role is take from team

		this._throwErrorIfUserExistByEmail(team,email);

		//if not already in invite list
		if (!invitedUserIds.some(teamUser => teamUser.email === email))
			invitedUserIds.push({ email, role });

		return Promise.all([
			this._generateLink({ esid, email, teamId, importHash }, isUserCreated), 
			patchTeam(this, teamId, { invitedUserIds }, params),
		]).then(([linkData, _]) => {
			return this._response({ linkData, user, role, isUserCreated });
		});
	}

	/**
	 * @param {String} teamId 
	 * @param {Object::{email::String, userId::String, role::String}} data 
	 * @param {Object::params} params The request params.
	 */
	patch(teamId, { email, userId, role }, params) {
		try {
			if (isDefined(role) && ['teamexpert', 'teamadministrator'].includes(role) === false)
				throw new BadRequest('Wrong role is set.');

			if (email)
				return this._userImportByEmail({ email, role, teamId }, params);
			else if (userId && role)
				return this._userImportById({ teamId, userId, role }, params);
			else
				throw new BadRequest('Missing input data.');

		} catch (err) {
			warn(err);
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
				throw new NotFound('User is not in this team.');

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
			throw new BadRequest('Missing parameter.');

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
