const { authenticate } = require('feathers-authentication').hooks;
const { disable } = require('feathers-hooks');
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
	update: [disable()],
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

const beforeSectionAttachments = {
	all: [passRequestDataToParams,
		ifNotLocal(saveAndClearQuery),], find: [], get: [], create: [], update: [], patch: [], remove: []
}

const beforeLesson = Object.assign({}, before, {
	create: [ifNotLocal(disable())],
	remove: [ifNotLocal(disable())],
});

module.exports = {
	before,
	after,
	beforeLesson,
	beforeSectionAttachments,
};
