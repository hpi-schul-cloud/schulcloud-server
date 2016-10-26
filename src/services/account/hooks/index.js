'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;
const { ifNotLocal } = require('./allowLocalUnauthenticated');

exports.before = {
	find: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()
	],
	get: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()
	],
	create: [
		ifNotLocal(auth.hashPassword())
	],
	update: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	],
	patch: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	],
	remove: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	]
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
