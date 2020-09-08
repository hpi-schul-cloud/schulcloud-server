const { BadRequest } = require('@feathersjs/errors');
const { isValidObjectId } = require('mongoose');

const validateParams = async (context) => {
	const { _ids } = context.params.query;

	if (!context.id && !_ids) {
		throw new BadRequest('The request requires either an id or ids to be present.');
	}

	if (context.id && !(isValidObjectId(context.id) || typeof context.id === 'string')) {
		throw new BadRequest('The type for id is incorrect.');
	}

	if (_ids && !Array.isArray(_ids)) {
		throw new BadRequest('The type for ids is incorrect.');
	}

	if (_ids.some((id) => !isValidObjectId(id))) {
		throw new BadRequest('The type for either one or several ids is incorrect.');
	}

	return context;
};

module.exports = {
	validateParams,
};
