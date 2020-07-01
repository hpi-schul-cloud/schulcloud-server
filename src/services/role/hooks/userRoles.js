const { Forbidden } = require('@feathersjs/errors');

exports.restrictGetToCurrentUser = (context) => {
	if (context.params.account.userId.toString() !== context.id.toString()) {
		throw new Forbidden('You not have the permissions to read this data!!!');
	}
	return context;
};
