// Application hooks that run for every service

const errors = require('feathers-errors');
const globalHooks = require('./hooks');
const _ = require('lodash');

/**
 * Checks whether a request was sent by a friendly service :).
 * @param hook contains pretty much everything.
 * @returns either the hook itself, as it was successful or denies the request.
 */
const friendlyCheck = (hook) => {
	let friends = hook.app.get('secrets').valid_Tokens.split(' ');

	if (_.includes(friends, hook.params.headers['x-api-token']))
		return Promise.resolve(hook);
	else
		return Promise.reject(new errors.Forbidden('Thanks for being interested in our api!\nIn case you are interested in a job at us, please email jan.renz [at] hpi.de'));
};

module.exports = {
	before: {
		all: [globalHooks.ifNotLocal(friendlyCheck)],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: []
	},

	after: {
		all: [ ],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: []
	}
};
