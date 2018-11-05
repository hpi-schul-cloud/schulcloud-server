'use strict';

const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const {teamsModel} = require('./model');
const hooks = require('./hooks');
//todo docs require 

class Invites {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
		this.app = options.app;
	}

	find(params) {
		const teamsService = this.app.service('teams');
		const userId = ( params.account || {} ).userId; //if userId is undefined no result is found
		const restrictedFindMatch = { invitedUserIds: { $elemMatch: { userId } } }

		return teamsService.find({query:restrictedFindMatch});
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
	app.use('/teams/extern/invites', new Invites({app}) );

	const teamsServices = app.service('/teams');
	const teamsInviteServices = app.service('/teams/extern/invites');

	teamsServices.before(hooks.before);
	teamsServices.after(hooks.after);

	teamsInviteServices.before(hooks.beforeExtern);
	teamsInviteServices.after(hooks.afterExtern);
};