const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const { errors: { BadRequest, NotAuthenticated } } = require('../../../utils');

const test = (context) => {
	try {
		null.forEach((r) => r);
	} catch(err) {
		try {
			throw new BadRequest('WTF ALL IS WRONG', err, { id: 2, x: 'string' });
		} catch (err) {
			throw new NotAuthenticated('WTF ALL IS WRONG', err, { zz: 6000, x: 'key schieß mich tot.' });
		}
		
	}
	return context;
}

exports.before = {
	all: [test],
	find: [authenticate('jwt')],
	get: [hooks.disallow()],
	create: [hooks.disallow()],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
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
