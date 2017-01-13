'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = function(app) {
	return {
		all: [],
		find: [



		],
		get: [

		],
		create: [

			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [




		],
		patch: [




		],
		remove: [




		]
	};
};



exports.after = {
	all: [hooks.remove('password')],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
