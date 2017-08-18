'use strict';

const stripJs = require('strip-js');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if(hook.data && hook.data.contents) {
			hook.data.contents = (hook.data.contents || []).map((item) => {
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
	find: [],
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
	create: [],
	update: [],
	patch: [],
	remove: []
};
