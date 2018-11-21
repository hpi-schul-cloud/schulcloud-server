'use strict';

const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const { teamsModel } = require('./model');
const hooks = require('./hooks');
const logger = require('winston');
const userModel = require('../user/model').userModel;
const {bsonIdToString} = require('./hooks/collection');
//const {teamRolesToHook} = require('./hooks');
//todo docs require 

const getUpdatedSchoolIdArray = (team, user) => {
	let schoolIds = bsonIdToString(team.schoolIds);
	const userSchoolId = bsonIdToString(user.schoolId);

	if (schoolIds.includes(userSchoolId) === false)
		schoolIds.push(userSchoolId);

	return schoolIds;
};

/**
 * It is important to use the params information from original request and defined the request to local.
 * @param {*} params 
 */
const mappedToLocal = (params)=>{
	if (typeof (params.provider) != 'undefined') 
		delete params.provider;
	return params;
};

class Get {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
		//this.app = options.app;
	}
	/**
	 * @param {} params 
	 */
	find(params) {
		const teamsService = this.app.service('teams');
		const usersService = this.app.service('users');

		const userId = ((params.account || {}).userId || {}).toString();
		return usersService.get(userId).then(_user => {
			const email = _user.email;
			const restrictedFindMatch = { invitedUserIds: { $elemMatch: { email } } };
			return teamsService.find({ query: restrictedFindMatch });
		}).catch(err => {
			logger.warn(err);
			throw new errors.NotFound('User do not exist.');
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
		//this.app = options.app;
	}

	/**
	 * 
	 * @param {*} id 
	 * @param {*} data 
	 * @param {*} params 
	 */
	async patch(id, data, params) {
		params = mappedToLocal(params);
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
				const schoolData = await schoolsService.find({query: {purpose: "expert"}});

				if (schoolData.data.length <= 0 || schoolData.data.length > 1) {
					throw new errors.GeneralError('Experte: Keine oder mehr als 1 Schule gefunden.');
				}

				expertSchool = schoolData.data[0];
			} catch (err) {
				throw new errors.GeneralError("Experte: Fehler beim Abfragen der Schule.", err);				
			}

			// get expert role to get id
			try {
				const roleData = await rolesService.find({query: {name: "expert"}});

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
				dbUser = await usersService.find({query: { email }});
			
			
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
					return {esid: expertSchool._id, email: newUser.email};
				} else if (role === 'teamexpert') {
					// existing expert user
					// prepare data for link generation
					return {esid: expertSchool._id, teamId: teamId};
				} else {
					return {teamId: teamId};
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
				const user = await usersService.find({query:{"email":email}});
				if (user.total===1) {
					// user found = existing teacher, invited with mail
					let invitedUserIds = team.invitedUserIds;
					invitedUserIds.push({ email, role });
					await teamsService.patch(teamId, { invitedUserIds }, params);
					return {message:'Success!', linkData: linkData, user: user.data[0]};
				} else if (user.total===0) {
					// user not found = expert invited via mail
					let invitedUserIds = team.invitedUserIds;
					invitedUserIds.push({ email, role });
					await teamsService.patch(teamId, { invitedUserIds }, params);
					return {message:'Success!', linkData: linkData};
				} else {
					errorHandling("Experts: Error on retrieving users or more than 1 user found.");
				}
			} catch (err) {
				errorHandling(err);
			}
		} else if (userId && role) {
			// user invited via ldap selection
			try {
				linkParams = {teamId: teamId};
				const linkData = await generateLink(linkParams);
				const user = await usersService.get(userId);
				const team = await teamsService.get(teamId);
				let userIds = team.userIds;
				const teamRoles = await hooks.teamRolesToHook(this);
				role = await teamRoles.findRole('name', role, '_id');
				userIds.push({ userId, role });
				const schoolIds = getUpdatedSchoolIdArray(team, user);
				await teamsService.patch(teamId, { userIds, schoolIds }, params);
				return({message:'Success!',linkData: linkData, user: user});
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
	/**
	 * 
	 * @param {*} id 
	 * @param {*} params 
	 */
	get(id, params) {
		params = mappedToLocal(params);
		const teamId = id;
		const userId = bsonIdToString((params.account || {}).userId);
		const teamsService = this.app.service('teams');
		const usersService = this.app.service('users');

		return usersService.get(userId).then(_user => {
			const email = _user.email;
			return teamsService.get(teamId).then(_team => {
				let invitedUserIds = _team.invitedUserIds;
				let userIds = _team.userIds;

				const invitedUser = invitedUserIds.find(element => element.email === email);
				if (invitedUser === undefined)
					throw new errors.NotFound('User is not in this team.');

				return hooks.teamRolesToHook(this).then(_self => {
					const role = _self.findRole('name', invitedUser.role, '_id');
					userIds.push({ userId, role });

					invitedUserIds = invitedUserIds.reduce((stack, element) => {
						if (element.email !== email)
							stack.push(element);
						return stack;
					}, []);

					const schoolIds = getUpdatedSchoolIdArray(_team, _user);
					const accept = {userId,teamId};

					return teamsService.patch(teamId, { invitedUserIds, userIds, schoolIds, accept }, params).catch(err => {
						throw new errors.Conflict('Can not patch team with changes.', err);
					});
				});
			}).catch(err => {
				throw new errors.NotFound('Can not take the team.', err);
			});
		}).catch(err => {
			logger.warn(err);
			throw new errors.Forbidden('You have not the permission to do this.');
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
	patch(id, data, params) {
		params = mappedToLocal(params);
		const teamId = id;
		const teamsService = this.app.service('teams');
		const email = data.email;

		return teamsService.get(teamId).then(_team => {
			let invitedUserIds = _team.invitedUserIds.reduce((stack, element) => {
				if (element.email !== email)
					stack.push(element);
				return stack;
			}, []);

			return teamsService.patch(teamId, { invitedUserIds }, params).catch(err => {
				throw new errors.Conflict('Can not patch team with changes.', err);
			});
		}).catch(err => {
			logger.warn(err);
			throw new errors.NotFound('No team found.');
		});
		//remove user from inv list
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
};
