'use strict';

const auth = require('feathers-authentication');
const hooks = require('feathers-hooks');
const local = require('feathers-authentication-local');
const errors = require('feathers-errors');

const MoodleLoginStrategy = require('../strategies/moodle');
const ITSLearningLoginStrategy = require('../strategies/itslearning');
const LernsaxLoginStrategy = require('../strategies/lernsax');
const LocalLoginStrategy = require('../strategies/local');

// don't initialize strategies here - otherwise massive overhead
// TODO: initialize all strategies here once
const strategies = {
	moodle: MoodleLoginStrategy,
	itslearning: ITSLearningLoginStrategy,
	lernsax: LernsaxLoginStrategy,
	local: LocalLoginStrategy
};


const validateCredentials = (hook) => {
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
};

const createLocalAccount = (hook) => {
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
};

exports.before = {
	// find, get and create cannot be protected by auth.hooks.authenticate('jwt')
	// otherwise we cannot get the accounts required for login
	find: [],
	get: [],
	create: [
		validateCredentials,
		local.hooks.hashPassword({ passwordField: 'password' })
	],
	update: [auth.hooks.authenticate('jwt')],
	patch: [auth.hooks.authenticate('jwt')],
	remove: [auth.hooks.authenticate('jwt')]
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
