const { Forbidden } = require('@feathersjs/errors');
const { ObjectId } = require('../../../helper/compare');

exports.restrictGetToCurrentUser = (context) => {
	if (!ObjectId.equal(context.params.account.userId, context.id)) {
		throw new Forbidden('You not have the permissions to read this data!!!');
	}
	return context;
};
