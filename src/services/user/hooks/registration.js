const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

const mailToLowerCase = (context) => {
	if (context.data) {
		if (context.data.email) {
			context.data.email = context.data.email.toLowerCase();
		}
		if (context.data.parent_email) {
			context.data.parent_email = context.data.parent_email.toLowerCase();
		}
		if (context.data.student_email) {
			context.data.student_email = context.data.student_email.toLowerCase();
		}
	}
	return context;
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [
		mailToLowerCase,
	],
	update: [
		mailToLowerCase,
	],
	patch: [
		mailToLowerCase,
	],
	remove: [],
};
