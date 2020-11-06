const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

/**
 * Check if user id from route is the same like in authenticaiton payload
 * Works only with authenticated user
 * @param {*} context
 */
exports.restrictToCurrentUser = (context) => {
	if (context.params.route.userId === context.params.authentication.payload.userId) {
		return context;
	}

	throw new Forbidden('You are only allowed to request your onw consent');
};
