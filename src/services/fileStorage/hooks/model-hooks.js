'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const permissions = require('../utils/filePermissionHelper');

const restrictToCurrentUser = hook => {
	let files = hook.result.data;
	let userId = hook.params.account.userId;
	let allowedFiles = [];
	let queries = hook.params.query;
	// permissions check for each file
	return Promise.all(files.map(f => {
		return permissions.checkPermissions(userId, f.key, ['can-write'], false, queries).then(isAllowed => {
			if (isAllowed) {
				f.context = isAllowed.context;
				allowedFiles.push(f);
			}
			return;
		});
	})).then(_ => {
		// get context folder name
		return Promise.all(allowedFiles.map(f => {
			let context = f.context;
			if (!context) {
				f.context = 'geteilte Datei';
			}
			else if (context === 'user') {
				f.context = 'Meine Dateien';
			}
			else {
				f.context = context.name;
			}
			return f;
		})).then(files => {
			hook.result.data = files;
			return hook;
		});
	});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [],
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
