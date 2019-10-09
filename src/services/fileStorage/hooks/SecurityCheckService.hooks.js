const { BadRequest } = require('@feathersjs/errors');
const { disallow } = require('feathers-hooks-common');

const parseData = (context) => {
	if (context.data) {
		if (context.data instanceof String || context.data instanceof Buffer) {
			context.data = JSON.parse(context.data);
			return context;
		}
	}
	throw new BadRequest('Expected request data to exist and to be a String or a Buffer.');
};

exports.before = {
	all: [],
	find: [disallow('external')],
	get: [disallow('external')],
	create: [disallow('external')],
	update: [parseData],
	patch: [disallow('external')],
	remove: [disallow('external')],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
