/* eslint-disable no-param-reassign */
const rpn = require('request-promise-native');
const querystring = require('querystring');
const { BadRequest } = require('feathers-errors');

const logger = require('../../../logger');

const REQUEST_TIMEOUT = process.env.NODE_ENV !== 'production' ? 120 * 1000 : 6 * 1000;
const EDITOR_MS = process.env.EditorMicroService || 'http://localhost:4001';

const mapMethod = {
	get: 'GET',
	find: 'GET',
	create: 'POST',
	remove: 'DELETE',
	patch: 'PATCH',
	update: 'UPDATE',
};

const isObjectWithElements = e => e && Object.keys(e).length > 0;

const override = (params, overrideData = {}) => {
	const { request } = params;
	Object.keys(request).forEach((key) => {
		if (overrideData[key]) {
			request[key] = overrideData[key];
		}
	});
	return request;
};

// eslint-disable-next-line object-curly-newline
const getOptions = (uri, { data, userId, method, id }, query) => {
	const addedId = id ? `/${id}` : '';
	query = query.length > 0 ? `?${query}` : '';
	const options = {
		uri: `${EDITOR_MS}/${uri}${addedId}${query}`,
		method: mapMethod[method] || 'GET',
		headers: {
			Authorization: userId,
		},
		json: true,
		timeout: REQUEST_TIMEOUT,
	};
	if (isObjectWithElements(data)) {
		options.body = data;
	}
	return options;
};

// todo override replace with explicit data picks.
/**
 * Avaible params includes in settings:
 * @param uri - uri of editor service, that do not contain the full url path
 * 				example: "groups" is request editor mircoservice service groups
 * @param params -  params must be include the object request,
 * 					that contain userId, id, data and method of the request
 * @param overrideData - to override params.request information
 * @return {Promise.resolve}
 * @throws {BadRequest}
 */
module.exports = (uri, params, overrideData) => {
	if (!params.request) {
		throw new BadRequest('Missing request data in params.');
	}
	return rpn(getOptions(uri, override(params, overrideData), querystring.stringify(params.query)))
		.catch((err) => {
			logger.warn(new BadRequest(err));
			throw new BadRequest('Can not execute or fetch data.');
		});
};
