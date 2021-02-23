const { Forbidden } = require('../../../errors');
const { hasRole } = require('../../../hooks');

/**
 * ensure the user is on the same school as the datasource.
 */
module.exports = async (context) => {
	const user = await context.app.service('users').get(context.params.account.userId);
	const isSuperHero = await hasRole(context, context.params.account.userId, 'superhero');
	if (isSuperHero) return context;
	if (user.schoolId.toString() !== context.params.datasource.schoolId.toString()) {
		throw new Forbidden('You do not have valid permissions to access this.');
	}
	return context;
};
