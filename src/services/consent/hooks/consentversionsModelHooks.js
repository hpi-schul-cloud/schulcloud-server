const { iff, isProvider, disallow } = require('feathers-hooks-common');

const before = {
	all: [],
	find: [iff(isProvider('external'), disallow())],
	get: [iff(isProvider('external'), disallow())],
	create: [iff(isProvider('external'), disallow())],
	update: [disallow()],
	patch: [disallow()],
	remove: [iff(isProvider('external'), disallow())],
};

const after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
