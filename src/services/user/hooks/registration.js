const { mailToLowerCase } = require('./global');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [
		mailToLowerCase,
	],
	update: [
		mailToLowerCase,
	],
	patch: [
		mailToLowerCase,
	],
	remove: [],
};
