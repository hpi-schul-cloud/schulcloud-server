'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const addToSubmission = hook => {
	const submissionService = hook.app.service('/submissions');

	submissionService.patch(hook.result.submissionId, {$push: {comments: hook.result._id}});
};

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.mapPaginationQuery.bind(this)],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [addToSubmission],
  update: [],
  patch: [],
  remove: []
};
