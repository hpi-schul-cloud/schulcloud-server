'use strict';

const stripJs = require('strip-js');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');
const lesson = require('../model');

exports.before = {
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if(hook.data && hook.data.contents) {
			hook.data.contents = (hook.data.contents || []).map((item) =>{
				item.user = item.user || hook.params.account.userId;
				switch (item.component) {
					case 'text':
						if (item.content && item.content.text) {
							item.content.text = stripJs(item.content.text);
						}
						break;
				}
				return item;
			});
		}
		return hook;
	}],
	find: [globalHooks.hasPermission('TOPIC_VIEW')],
	get: [globalHooks.hasPermission('TOPIC_VIEW')],
	create: [globalHooks.hasPermission('TOPIC_CREATE')],
	update: [globalHooks.hasPermission('TOPIC_EDIT')],
	patch: [globalHooks.hasPermission('TOPIC_EDIT')],
	remove: [globalHooks.hasPermission('TOPIC_CREATE')]
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
