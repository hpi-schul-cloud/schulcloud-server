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

class Get {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
		//this.app = options.app;
	}
	/**
	 * 
	 * @param {*} params 
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
		const teamsService = this.app.service('teams');
		const usersService = this.app.service('users');
		const schoolsService = this.app.service('schools');
		const rolesService = this.app.service('roles');
		const expertLinkService = this.app.service('/expertinvitelink');
		const email = data.email;
		const userId = data.userId;
		let role = data.role;
		const teamId = id;
		let newUser = {};
		let expertSchool = {};
		let expertRole = {};
		
		const errorHandling = err => {
			logger.warn(err);
			return Promise.resolve('Success!');
		};

		if (['teamexpert', 'teamadministrator'].includes(role) === false) {
			return errorHandling('Experte: Wrong role is set.');
		}

		if (email && role) {
			
			const waitForUser = new Promise((resolve, reject) => {
				usersService.find({
					query: { email }
				}).then(async dbUser => {
					let existingUser;
					
					if (dbUser.data !== undefined && dbUser.data.length > 0)
						existingUser = dbUser.data[0];
					
					// get expert school with "purpose": "expert" to get id
					await schoolsService.find({query: {purpose: "expert"}}).then(school => {
						if(school.data.length <= 0 || school.data.length > 1) {
							throw new errors.BadRequest('Experte: Keine oder mehr als 1 Schule gefunden.');
						}
						expertSchool = school.data[0];
					}).catch(err => {
						throw new errors.BadRequest("Experte: Fehler beim Abfragen der Schule.", err);
					});
					
					// get expert role to get id
					await rolesService.find({query: {name: "expert"}}).then(role => {
						if(role.data.length <= 0 || role.data.length > 1) {
							throw new errors.BadRequest('Experte: Keine oder mehr als 1 Rolle gefunden.');
						}
						expertRole = role.data[0];
					}).catch(err => {
						throw new errors.BadRequest("Experte: Fehler beim Abfragen der Rolle.", err);
					});

					//user do not exist and it must be an teamexpert, all others must have accounts before
					if (existingUser === undefined && role === 'teamexpert') {
						try {
							// create user with expert role
							await userModel.create({
								email: email,
								schoolId: expertSchool._id,
								roles: [expertRole._id], // expert
								firstName: "Experte",
								lastName: "Experte"
							}, (err, cUser) => {
								if (err) {
									throw new errors.BadRequest("Experte: Fehler beim Erstellen des Nutzers.", err);
								} else {
									if (cUser.email) {
										newUser = cUser;
									}
								}
							});
							
							// generate invite link
							expertLinkService.create({esid: expertSchool._id, email: newUser.email}).then(linkData => {
								resolve(linkData);
							}).catch(err => {
								throw new errors.BadRequest("Experte: Fehler beim Erstellen des Einladelinks.", err);
							});
						} catch (err) {
							throw new errors.BadRequest("Experte: Fehler beim Generieren des Experten-Links.", err);
						}
					} else {
						//user already exist
						//patch team
						// generate invite link
						expertLinkService.create({esid: expertSchool._id, teamId: teamId}).then(linkData => {
							resolve(linkData);
						}).catch(err => {
							throw new errors.BadRequest("Experte: Fehler beim Erstellen des Einladelinks.", err);
						});
					}
				}).catch(err => {
					logger.warn(err);
					reject(new errors.Conflict('Experte: User services not avaible.'));
				});
			});

			return waitForUser.then(data => {
				return teamsService.get(teamId).then(_team => {
					let invitedUserIds = _team.invitedUserIds;
					invitedUserIds.push({ email, role });
					return teamsService.patch(teamId, { invitedUserIds }, params).then(_patchedTeam => {
						return Promise.resolve({message:'Success!',linkData: data});
					}).catch(errorHandling);
				}).catch(errorHandling);
			});
		} else if (userId && role) {
			return usersService.get(userId).then(_user => {
				return teamsService.get(teamId).then(_team => {
					let userIds = _team.userIds;
					return hooks.teamRolesToHook(this).then(_self => {
						role = _self.findRole('name', role, '_id');
						userIds.push({ userId, role });
						const schoolIds = getUpdatedSchoolIdArray(_team, _user);
						return teamsService.patch(teamId, { userIds, schoolIds }, params).then(_patchedTeam => {
							return Promise.resolve({message:'Success!',linkData: data})
						}).catch(errorHandling);
					}).catch(errorHandling);
				}).catch(errorHandling);
			}).catch(errorHandling);
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
