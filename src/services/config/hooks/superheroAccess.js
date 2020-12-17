const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

const { hasRole } = require('../../../hooks');

const superheroAccess = async (context) => {
	const isSuperHero = await hasRole(context, context.params.account.userId, 'superhero');
	if (!isSuperHero) {
		throw new Forbidden('You has no access.');
	}
	return context;
};

module.exports = superheroAccess;
