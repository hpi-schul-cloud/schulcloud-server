'use strict';

const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const { teamsModel } = require('./model');
const hooks = require('./hooks');
const { createUserWithRole } = require('./hooks/helpers');
const logger = require('winston');
const userModel = require('../user/model').userModel;
const {
	isArray,
	isArrayWithElement,
	isObject,
	isString,
	hasKey,
	isDefined,
	isUndefined,
	isNull,
	isObjectId,
	isObjectIdWithTryToCast,
	throwErrorIfNotObjectId,
	bsonIdToString,
	isSameId,
	isFunction
} = require('./hooks/collection');
//const {teamRolesToHook} = require('./hooks');
//todo docs require 

/**
 * 
 * @param {*} team 
 * @param {*} user 
 */
const getUpdatedSchoolIdArray = (team, user) => {
	let schoolIds = bsonIdToString(team.schoolIds);
	const userSchoolId = bsonIdToString(user.schoolId);

	if (schoolIds.includes(userSchoolId) === false)
		schoolIds.push(userSchoolId);

	return schoolIds;
};

/**
 * 
 * @param {*} team 
 * @param {*} email 
 */
const removeInvitedUserByEmail = (team, email) => {
	return team.invitedUserIds.filter(user => user.email !== email);
};

/**
 * 
 * @param {*} app 
 * @param {*} params 
 */
const getSessionUser = (app, params, userId) => {
	const sesessionUserId = userId || bsonIdToString((params.account || {}).userId);

	return app.service('users').get(sesessionUserId).catch(err => {
		logger.warn(err);
		throw new errors.Forbidden('You have not the permission.');
	});
};

/**
 * 
 * @param {*} app 
 * @param {*} teamId 
 * @param {*} data 
 * @param {*} params 
 */
const patchTeam = (app, teamId, data, params) => {
	return app.service('teams').patch(teamId, data, local(params)).catch(err => {
		logger.warn(err);
		throw new errors.BadRequest('Can not patch team.');
	});
};

/**
 * 
 * @param {*} app 
 * @param {*} teamId 
 */
const getTeam = (app, teamId) => {
	return app.service('teams').get(teamId).catch(err => {
		logger.warn(err);
		throw new errors.Forbidden('You have not the permission.');
	});
};

/**
 * 
 * @param {*} refClass 
 * @param {*} teamId 
 * @param {*} params 
 */
const getBasic = (refClass, teamId, params, userId) => {
	return Promise.all([hooks.teamRolesToHook(refClass), getSessionUser(refClass.app, params, userId), getTeam(refClass.app, teamId)]);
};

/**
 * It is important to use the params information from original request and defined the request to local.
 * @param {*} params 
 */
const local = (params) => {
	if (typeof (params.provider) != 'undefined')
		delete params.provider;
	return params;
};

class AdminOverview {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
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

	mapped(teams, sessionSchoolId) {
		return teams.data.map(team => {
			const mySchool = isSameId(team.schoolId, sessionSchoolId);
			const otherSchools = team.schoolIds.length > 1;
			const schoolMembers = this.getMembersBySchool(team, sessionSchoolId);

			return {
				membersTotal: team.userIds.length,
				name: team.name,
				_id: team._id,
				color: team.color,
				desciption: team.desciption,
				mySchool,
				otherSchools,
				schoolMembers,
				createdAt: team.createdAt
			};
		});
	}

	find(params) {
		return getSessionUser(this.app, params).then(sessionUser => {
			const schoolId = sessionUser.schoolId;
			return this.app.service('teams').find({
				query: {
					userIds: { $elemMatch: { schoolId } }
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
	 * If school is created from other school, it remove all users from own school.
	 * @param {String} teamId 
	 * @param {Object} data data.userId 
	 * @param {Object} params 
	 */
	patch(teamId, data, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { ownerExist, isOwnerSchool, selectedRole, schoolId } = this.getIsOwnerStats(ref, sessionUser, team);
			const userId = data.userId;
			let userIds = team.userIds;

			if (!ownerExist && isOwnerSchool && isDefined(userId)) {
				userIds.push(createUserWithRole(ref, { userId, schoolId, selectedRole }));
				return patchTeam(this.app, teamId, { userIds }, params);
			} else if (!isOwnerSchool && isUndefined(userId)) {
				userIds = this.removeMemberBySchool(team, schoolId);
				patchTeam(this.app, teamId, { userIds }, params);
			} else {
				throw new errors.BadRequest('Wrong inputs.');
			}
		});
	}

	remove(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { ownerExist, isOwnerSchool } = this.getIsOwnerStats(ref, sessionUser, team);
			if (!ownerExist && isOwnerSchool) {
				return this.app.service('teams').remove(teamId);
			} else {
				throw new errors.Forbidden('You have not the permission.');
			}
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
		return getSessionUser(this.app, params).then(sessionUser => {
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
	 * 
	 * @param {*} id 
	 * @param {*} data 
	 * @param {*} params 
	 */
	async patch(id, data, params) {
		params = local(params);
		const teamsService = this.app.service('teams');
		const usersService = this.app.service('users');
		const schoolsService = this.app.service('schools');
		const rolesService = this.app.service('roles');
		const expertLinkService = this.app.service('/expertinvitelink');
		const email = data.email;
		const userId = data.userId;
		const teamId = id;
		let role = data.role;
		let expertSchool = {};
		let expertRole = {};
		let linkParams = {};


		const errorHandling = err => {
			logger.warn(err);
			return Promise.resolve('Success!');
		};

		if (['teamexpert', 'teamadministrator'].includes(role) === false) {
			return errorHandling('Experte: Wrong role is set.');
		}

		const generateLink = async (params) => {
			try {
				return await expertLinkService.create(params);
			} catch (err) {
				throw new errors.GeneralError("Experte: Fehler beim Erstellen des Einladelinks.", err);
			}
		};

		const collectData = async () => {
			// get expert school with "purpose": "expert" to get id
			try {
				const schoolData = await schoolsService.find({ query: { purpose: "expert" } });

				if (schoolData.data.length <= 0 || schoolData.data.length > 1) {
					throw new errors.GeneralError('Experte: Keine oder mehr als 1 Schule gefunden.');
				}

				expertSchool = schoolData.data[0];
			} catch (err) {
				throw new errors.GeneralError("Experte: Fehler beim Abfragen der Schule.", err);
			}

			// get expert role to get id
			try {
				const roleData = await rolesService.find({ query: { name: "expert" } });

				if (roleData.total != 1) {
					throw new errors.GeneralError('Experte: Keine oder mehr als 1 Rolle gefunden.');
				}

				expertRole = roleData.data[0];
			} catch (err) {
				throw new errors.GeneralError("Experte: Fehler beim Abfragen der Rolle.", err);
			}
		};

		const waitForUser = async () => {
			let existingUser, dbUser;
			try {
				dbUser = await usersService.find({ query: { email } });


				if (dbUser.data !== undefined && dbUser.data.length > 0)
					existingUser = dbUser.data[0];

				// not existing user == must be teamexpert -> add user
				if (existingUser === undefined && role === 'teamexpert') {
					// create user with expert role
					const newUser = await userModel.create({
						email: email,
						schoolId: expertSchool._id,
						roles: [expertRole._id], // expert
						firstName: "Experte",
						lastName: "Experte"
					});
					// prepare data for link generation
					return { esid: expertSchool._id, email: newUser.email };
				} else if (role === 'teamexpert') {
					// existing expert user
					// prepare data for link generation
					return { esid: expertSchool._id, teamId: teamId };
				} else {
					return { teamId: teamId };
				}
			} catch (err) {
				throw new errors.GeneralError("Experte: Fehler beim Erstellen des Experten.", err);
			}
		};

		if (email && role) {
			// user invited via email
			try {
				await collectData();
				const linkParams = await waitForUser();
				const linkData = await generateLink(linkParams);
				const team = await teamsService.get(teamId);
				const user = await usersService.find({ query: { "email": email } });
				let invitedUserIds = team.invitedUserIds;
				if (user.total === 1) {
					// user found = existing teacher, invited with mail
					invitedUserIds.push({ email, role });
					await teamsService.patch(teamId, { invitedUserIds }, params);
					return { message: 'Success!', linkData: linkData, user: user.data[0] };
				} else if (user.total === 0) {
					// user not found = expert invited via mail
					invitedUserIds.push({ email, role });
					await teamsService.patch(teamId, { invitedUserIds }, params);
					return { message: 'Success!', linkData: linkData };
				} else {
					errorHandling("Experts: Error on retrieving users or more than 1 user found.");
				}
			} catch (err) {
				errorHandling(err);
			}
		} else if (userId && role) {
			// user invited via ldap selection
			try {		
				const [ref, user, team] = await getBasic(this, teamId, params, userId);
				const schoolId = user.schoolId;
				const schoolIds = getUpdatedSchoolIdArray(team, user);
				const linkData = { shortLink: process.env.HOST + '/teams' + teamId };
				let userIds = team.userIds;
				userIds.push(createUserWithRole(ref, { userId, selectedRole: role, schoolId }));
				await patchTeam(this.app, teamId, { userIds, schoolIds }, params);
				return ({ message: 'Success!', linkData, user });
			} catch (err) {
				errorHandling(err);
			}
		} else {
			throw new errors.BadRequest('Missing input data.');
		}
	}

	setup(app, path) {
		this.app = app;
	}
}
//todo accept and add user is same => add to function .only modified invitedUserIds is different
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
	 * 
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

			return patchTeam(this.app, teamId, { invitedUserIds, userIds, schoolIds, accept }, params);
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
	 * 
	 * @param {*} id 
	 * @param {*} data 
	 * @param {*} params 
	 */
	patch(teamId, data, params) {
		const email = data.email;
		const app = this.app;

		if (isUndefined(email))
			throw new errors.BadRequest('Missing parameter.');

		return getTeam(app, teamId).then(team => {
			let invitedUserIds = removeInvitedUserByEmail(team, email);
			return patchTeam(app, teamId, { invitedUserIds }, params);
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
			default: 10,
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
