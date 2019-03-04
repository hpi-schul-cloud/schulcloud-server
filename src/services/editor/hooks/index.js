const { authenticate } = require('feathers-authentication').hooks;
const { ifNotLocal } = require('../../../hooks/');
const {
	populateUsers,
	passRequestDataToParams,
	extractFindData,
	block,
	saveAndClearQuery,
} = require('./hooks');

const before = {
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

const after = {
	all: [],
	find: [extractFindData],
	get: [populateUsers],
	create: [populateUsers],
	update: [],
	patch: [populateUsers],
	remove: [],
};

const beforeLesson = Object.assign(before, {
	create: [ifNotLocal(block)],
});

module.exports = {
	before,
	after,
	beforeLesson,
};
