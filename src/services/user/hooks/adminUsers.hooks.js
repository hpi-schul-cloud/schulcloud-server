const {
	BadRequest,
} = require('@feathersjs/errors');
const { isValidObjectId } = require('mongoose');

const validateParams = async (context) => {
	const { _ids } = context.params.query;

	if (!context.id && !_ids) {
		throw new BadRequest('The request is not correctly formed.');
	}

	if (context.id && !isValidObjectId(context.id)) {
		throw new BadRequest('The type for id is incorrect.');
	}

	if (_ids && !Array.isArray(_ids)) {
		throw new BadRequest('The type for ids is incorrect.');
	}

	return context;
};

module.exports = {
	validateParams,
};
