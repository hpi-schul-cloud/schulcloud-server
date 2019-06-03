

const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

const addToSubmission = (hook) => {
	const submissionService = hook.app.service('/submissions');

	submissionService.patch(hook.result.submissionId, { $push: { comments: hook.result._id } });
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('COMMENTS_VIEW'), globalHooks.mapPaginationQuery.bind(this)],
	get: [globalHooks.hasPermission('COMMENTS_VIEW')],
	create: [globalHooks.hasPermission('COMMENTS_CREATE')],
	update: [globalHooks.hasPermission('COMMENTS_EDIT')],
	patch: [globalHooks.hasPermission('COMMENTS_EDIT'), globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('COMMENTS_CREATE'), globalHooks.permitGroupOperation],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [addToSubmission],
	update: [],
	patch: [],
	remove: [],
};
