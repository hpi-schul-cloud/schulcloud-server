/* eslint-disable no-underscore-dangle */

const { isValidObjectId } = require('mongoose');
const { BadRequest } = require('../../../errors');

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

const parseRequestQuery = (context) => {
	const { query } = context.params;

	if (query._ids && typeof query._ids === 'object' && !Array.isArray(query._ids)) {
		// If the number of users exceeds 20, the underlying parsing library
		// will convert the array to an object with the index as the key.
		// To continue working with it, we convert it here back to the array form.
		// See the documentation for further infos: https://github.com/ljharb/qs#parsing-arrays
		query._ids = Object.values(query._ids);
	}

	return context;
};

module.exports = {
	validateParams,
	parseRequestQuery,
};
