'use strict';

const hooks = require('feathers-hooks');
const local = require('feathers-authentication-local');
const errors = require('feathers-errors');

const MoodleLoginStrategy = require('../strategies/moodle');
const ITSLearningLoginStrategy = require('../strategies/itslearning');
const LernsaxLoginStrategy = require('../strategies/lernsax');
const LocalLoginStrategy = require('../strategies/local');

// don't initialize strategies here - otherwise massive overhead
const strategies = {
	moodle: MoodleLoginStrategy,
	itslearning: ITSLearningLoginStrategy,
	lernsax: LernsaxLoginStrategy,
	local: LocalLoginStrategy
};

exports.before = {
	find: [],
	get: [],
	create: [
		(hook) => {
			const {username, password, systemId, noVerification} = hook.data;

			if(!username) throw new errors.BadRequest('no username specified');
			if(!password) throw new errors.BadRequest('no password specified');

			const app = hook.app;
			const systemService = app.service('/systems');
			return systemService.get(systemId)
				.then(system => {
					const strategy = strategies[system.type];
					return {
						strategy: new strategy(app),
						system
					};
				})
				.then(({strategy, system}) => {
					return strategy.login({username, password}, system);
				})
				.then((client) => {
					if (client.token) {
						hook.data.token = client.token;
					}
				});
		},
		local.hooks.hashPassword({ passwordField: 'password' })
	],
	update: [],
	patch: [],
	remove: []
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
