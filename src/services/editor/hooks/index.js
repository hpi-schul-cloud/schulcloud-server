const auth = require('feathers-authentication');
const logger = require('../../../logger/');

const populateUsers = (context) => {
	// todo populate id to {id, name:user.firstname+' '+user.lastname}
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

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		passRequestDataToParams,
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
