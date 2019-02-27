const auth = require('feathers-authentication');
const logger = require('../../../logger/');

const populateUsers = (context) => {
	// todo populate id to {id, name:user.firstname+' '+user.lastname}
	console.log(context.result);
	return context;
};

const passRequestDataToParams = (context) => {
	context.params.request = {
		method: context.method,
		userId: context.params.account.userId.toString(),
		id: context.id,
		data: context.data,
	};
	return context;
};

/**
 * No query parameter should pass to the Editor MircoService.
 * If any need, it added by the endpoints im server editor service.
 * But if you need any, the query is saved in params.clientQuery.
 */
const saveAndClearQuery = (context) => {
	context.params.clientQuery = context.params.query;
	context.params.query = {};
	return context;
};

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		passRequestDataToParams,
		saveAndClearQuery,
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [populateUsers],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
