const { authenticate } = require('@feathersjs/authentication').hooks; // require('feathers-authentication').hooks;
const hooks = require('feathers-hooks-common');
const { ifNotLocal } = require('../../../hooks/');
const {
	populateUsers,
	passRequestDataToParams,
	extractFindData,
	saveAndClearQuery,
} = require('./hooks');

const before = {
	all: [
		authenticate('jwt'),
		passRequestDataToParams,
		ifNotLocal(saveAndClearQuery),
	],
	find: [],
	get: [],
	create: [],
	update: [hooks.disallow()],
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

const beforeLesson = Object.assign({}, before, {
	create: [ifNotLocal(hooks.disallow())],
	remove: [ifNotLocal(hooks.disallow())],
});

module.exports = {
	before,
	after,
	beforeLesson,
};
