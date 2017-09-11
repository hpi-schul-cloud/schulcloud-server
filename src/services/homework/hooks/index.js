'use strict';

const stripJs = require('strip-js');
const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const filterApplicableHomework = hook => {
    let uId = hook.params.account.userId;
    let data = hook.result.data || hook.result;
    data = data.filter(function (c) {
        return (new Date(c.availableDate).getTime() < Date.now()
            && c.courseId != null
            && ((c.courseId.userIds || []).indexOf(uId) != -1) && !c.private)
            || JSON.stringify(c.teacherId) == JSON.stringify(uId);
    });

    if (hook.result.data)
        hook.result.data = data;
    else
        hook.result = data;

    return Promise.resolve(hook);
};

exports.before = {
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if (hook.data && hook.data.description) {
			hook.data.description = stripJs(hook.data.description);
		}

		return hook;
	}],
	find: [globalHooks.hasPermission('HOMEWORK_VIEW'), globalHooks.mapPaginationQuery.bind(this)],
	get: [globalHooks.hasPermission('HOMEWORK_VIEW')],
	create: [globalHooks.hasPermission('HOMEWORK_CREATE')],
	update: [globalHooks.hasPermission('HOMEWORK_EDIT')],
	patch: [globalHooks.hasPermission('HOMEWORK_EDIT')],
	remove: [globalHooks.hasPermission('HOMEWORK_CREATE')]
};

exports.after = {
	all: [],
	find: [filterApplicableHomework],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
