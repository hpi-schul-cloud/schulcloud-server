const axios = require('axios');
const loadash = require('lodash');
const { Configuration } = require('@schul-cloud/commons');

const defaultOptions = {
	timeout: Configuration.get('REQUEST_TIMEOUT_MILLIS'),
};

const defaultMethods = ['get', 'delete', 'head', 'options'];
const mutatingMethods = ['post', 'put', 'patch'];
const otherMethods = ['request'];

const requestWrapper = (method, url, data, options) => {
	const mergedOptions = loadash.merge({}, defaultOptions, options);
	if (defaultMethods.includes(method)) {
		return axios[method](url, mergedOptions);
	}
	if (mutatingMethods.includes(method)) {
		return axios[method](url, data, mergedOptions);
	}
	if (otherMethods.includes(method)) {
		return axios[method](options);
	}
	throw new Error('unsupported method', { method });
};

const get = (url, options) => {
	return requestWrapper('get', url, undefined, options);
};

const post = (url, data, options) => {
	return requestWrapper('post', url, data, options);
};

const request = (options) => {
	return requestWrapper('request', undefined, undefined, options);
};

// TODO check usage
module.exports = { requestWrapper, get, post, request };
