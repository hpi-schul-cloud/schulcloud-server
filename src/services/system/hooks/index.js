'use strict';

const {isAdmin, ifNotLocal} = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		ifNotLocal(isAdmin())],
	update: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		ifNotLocal(isAdmin())],
	patch: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		ifNotLocal(isAdmin())],
	remove: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		ifNotLocal(isAdmin())]
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
