const { Forbidden } = require('@feathersjs/errors');

exports.restrictToCurrentUser = (context) => {
	if (context.params.route.userId === context.params.authentication.payload.userId) {
		return context;
	}

	throw new Forbidden('You are only allowed to request your onw consent');
};
