const { authenticate } = require('@feathersjs/authentication');
const { lookupSchool } = require('../../../hooks');

const getBoolean = (value) => value === true || value === 'true';

/**
 * Convert pagination parameter to boolean if it exists
 * @param {context} context
 */
const preparePagination = (context) => {
	if (context.params) {
		const { query } = context.params;
		if (query && query.$paginate !== undefined) {
			context.params.query.$paginate = getBoolean(query.$paginate);
		}
	}
	return context;
};

exports.before = {
	all: [
	],
	find: [
		preparePagination,
	],
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
