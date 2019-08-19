const { authenticate } = require("@feathersjs/authentication").hooks;
// is admin
// restricted to current school

exports.before = {
	all: [authenticate("jwt")],
	find: [
		(hook) => {
			if (hook.params.query.$limit === '-1') {
				hook.params.paginate = false;
				delete hook.params.query.$limit;
			}
			return hook;
		}
	],
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
