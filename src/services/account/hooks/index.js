'use strict';

const { ifNotLocal } = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = {
	find: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()
	],
	get: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()
	],
	create: [
		(hook) => {
			var systemId = hook.data.systemId;
			const systemService = hook.app.service('/systems');

			const AccountHelper = require('./../helper')(hook.app).AccountHelper;

			return systemService.find({query: {_id: systemId}})
				.then(result => {
					if (result.data[0].type != 'local') return;

					var userId = hook.data.userId;
					const userService = hook.app.service('/users');
					return userService.find({query: {_id: userId}})
						.then(result => {
							var user = { firstName: result.data[0].firstName, lastName: result.data[0].lastName, email: result.data[0].email };
							var helper = new AccountHelper();
							return helper.create(user).then((credentials) => {
								hook.data = Object.assign(hook.data, credentials);
								return hook;
							});
						});
				});
		},
		ifNotLocal(auth.hashPassword())
	],
	update: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	],
	patch: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	],
	remove: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
