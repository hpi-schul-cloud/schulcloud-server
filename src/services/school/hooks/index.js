'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()],
	update: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()],
	patch: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()],
	remove: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()]
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
