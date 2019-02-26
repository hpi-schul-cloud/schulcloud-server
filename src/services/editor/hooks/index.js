const auth = require('feathers-authentication');
const logger = require('winston');

const populateUsers = (context) => {
	// todo populate id to {id, name:user.firstname+' '+user.lastname}
	return context;
};

const testIt = (context) =>{
	console.log(context);
	return context;
};

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		testIt,
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.afterAdmin = {
	all: [populateUsers],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
