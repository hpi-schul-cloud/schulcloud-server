const { authenticate } = require('feathers-authentication').hooks;
const { ifNotLocal } = require('../../../hooks/');
const {
	populateUsers,
	passRequestDataToParams,
	extractFindData,
	block,
	saveAndClearQuery,
} = require('./hooks');

exports.before = {
	all: [
		authenticate('jwt'),
		passRequestDataToParams,
		saveAndClearQuery,
	],
	find: [],
	get: [],
	create: [],
	update: [block],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [extractFindData],
	get: [populateUsers],
	create: [populateUsers],
	update: [],
	patch: [populateUsers],
	remove: [],
};

exports.beforeLesson = {
	create: [ifNotLocal(block)],
};
