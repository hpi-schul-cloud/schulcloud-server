'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const search = require('feathers-mongodb-fuzzy-search');
const permissions = require('../utils/filePermissionHelper');

const restrictToCurrentUser = hook => {
	let files = hook.result.data;
	let userId = hook.params.account.userId;
	let allowedFiles = [];
	// permissions check for each file
	return Promise.all(files.map(f => {
		return permissions.checkPermissions(userId, f.key, ['can-write'], false).then(isAllowed => {
			if (isAllowed) allowedFiles.push(f);
			return;
		})
	})).then(_ => {
		hook.result.data = allowedFiles;
		return hook;
	})
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [search({escape: false})],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [restrictToCurrentUser],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
