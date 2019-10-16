const {	Forbidden } = require('@feathersjs/errors');

/**
 * ensure the user is on the same school as the datasource.
 */
module.exports = async (context) => {
	const user = await context.app.service('users').get(context.params.account.userId);
	if (user.schoolId.toString() !== context.params.datasource.schoolId.toString()) {
		throw new Forbidden('You do not have valid permissions to access this.');
	}
	return context;
};
