const rpn = require('request-promise-native');
const logger = require('../../../logger');
const { BadRequest } = require('feathers-errors');

const mapMethod = {
	get: 'GET',
	find: 'GET',
	create: 'POST',
	remove: 'DELETE',
	patch: 'PATCH',
	update: 'UPDATE',
};

const REQUEST_TIMEOUT = 4000;
const EDITOR_MS = process.env.EditorMicroService || 'http://localhost:4001';

const getOptions = ({ uri, data, userId, method, id }) => {
	const addedId = id ? `/${id}` : '';
	return {
		uri: `${EDITOR_MS}/${uri}${addedId}`,
		method: mapMethod[method] || 'GET',
		headers: {
			'Authorization': userId
		},
		body: data,
		json: true,
		timeout: REQUEST_TIMEOUT,
	};
};

/**
 * Avaible params includes in settings:
 * @param uri - uri of editor service, that do not contain the full url path
 * 				example: "groups" is request editor mircoservice service groups
 * @param data
 * @param userId
 * @param method - feather methodes
 * @param id - id of the request ressource, it is added to the uri.
 * @return {Promise.resolve}
 * @throws {BadRequest}
 */
module.exports = (settings) => {
	return rpn(getOptions(settings)).catch((err) => {
		logger.warn(err);
		throw new BadRequest('Can not fetch editor data.');
	});
};
