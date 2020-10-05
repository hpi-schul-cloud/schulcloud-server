const { disallow } = require('feathers-hooks-common');
const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');

const requireId = (context) => {
	if ([null, undefined].includes(context.id)) {
		throw new Forbidden('Id must not be null or undefined.');
	}
	return context;
};

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
	find: [disallow()],
	get: [disallow()],
	create: [disallow()],
	update: [
		disallow('internal'), // this route is only available for an external callback
		requireId,
		parseData,
	],
	patch: [disallow()],
	remove: [disallow()],
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
