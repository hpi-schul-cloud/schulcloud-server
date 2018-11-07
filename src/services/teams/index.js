'use strict';

const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const { teamsModel } = require('./model');
const hooks = require('./hooks');
const logger = require('winston');
//todo docs require 

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
		const userId = (params.account || {}).userId; //if userId is undefined no result is found
		const restrictedFindMatch = { invitedUserIds: { $elemMatch: { userId } } }

		return teamsService.find({ query: restrictedFindMatch });
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
	patch(id, data, params) {
		const teamsService = this.app.service('team');
		const usersService = this.app.service('users');
		const email = data.email;
		const userId = data.userId;
		const role = data.role;
		const teamId = id;

		const errorHandling = err => {
			logger.warn(err);
			return Promise.resolve('Success!');
		};

		if (['teamexpert', 'teamadministrator'].includes(role) === false) {
			return errorHandling('Wrong role is set.');
		}

		if (email && role) {
			return teamsService.get(teamId)
				.then(_team => {
					let invitedUserIds = _team.invitedUserIds;
					invitedUserIds.push({ userId, role });

					return teamsService.patch(teamId, { invitedUserIds }, params)
						.then(_patchedTeam => {
							return Promise.resolve('Success!');
						})
						.catch(errorHandling)
				}).catch(errorHandling);
		} else if (userId && role) {
			return usersService.get(userId)
				.then(_user => {
					return teamsService.get(teamId).then(_team => {
						let userIds = _team.userIds;
						userIds.push({ userId, role });
						return teamsService.patch(teamId, { userIds }, params).catch(errorHandling);
					}).catch(errorHandling)
				}).catch(errorHandling);
		} else {
			throw new errors.BadRequest('Missing input data.');
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
	/**
	 * 
	 * @param {*} id 
	 * @param {*} params 
	 */
	get(id, params) {
		const teamId = id;
		
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
	 * @param {*} params 
	 */
	remove(id, params) {
		const teamId = id;
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