const { Forbidden } = require('../../../errors');

exports.restrictToCurrentUser = (context) => {
	if (
		context.id === context.params.authentication.payload.userId ||
		(context.params.query || {}).userId === context.params.authentication.payload.userId
	) {
		return context;
	}

	throw new Forbidden('You are only allowed to request your onw consent');
};
