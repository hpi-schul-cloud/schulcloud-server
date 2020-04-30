const { authenticate } = require('@feathersjs/authentication').hooks;
const { hasPermission } = require('../../../hooks');

// is admin
// restricted to current school

exports.before = {
	all: [authenticate('jwt'), hasPermission(['STUDENT_LIST', 'TEACHER_LIST'])],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
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
