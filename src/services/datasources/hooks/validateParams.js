const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

/**
 * validates the contents of the params.
 */
module.exports = (context) => {
	// prevent querying the config without the protectedFields, to prevent leaking protected data.
	if ((context.params.query || {}).$select) {
		const select = context.params.query.$select;
		if (!Array.isArray(select)) throw new BadRequest('$select should be an array');
		if (select.includes('config') && !select.includes('protected')) {
			context.params.query.$select.push('protected');
		}
	}
	return Promise.resolve(context);
};
