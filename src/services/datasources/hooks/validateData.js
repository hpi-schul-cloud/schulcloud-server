const { BadRequest } = require('@feathersjs/errors');

/**
 * checks for the fields required to create or patch a datasource, and filters any additional fields.
 */
module.exports = (context) => {
	if (context.method === 'create' && !(context.data.config)) {
		throw new BadRequest('this requires a config object.');
	}
	if (context.data.config && !context.data.config.type) {
		throw new BadRequest('config should contain a type');
	}
	Object.keys(context.data).forEach((key) => {
		if (!['schoolId', 'name', 'config'].includes(key)) {
			delete context.data[key];
		}
	});
	return context;
};
