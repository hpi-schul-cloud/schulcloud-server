const axios = require('axios');
const { Configuration } = require('@schul-cloud/commons');

const defaultOptions = {
	// baseURL:
	// headers:
	timeout: Configuration.get('REQUEST_TIMEOUT_MILLIS'),
};

const instance = axios.create(defaultOptions);

const defaultMethods = ['get', 'delete', 'head', 'options'];
const mutatingMethods = ['post', 'put', 'patch'];
const otherMethods = ['request'];

/**
 * Request wrapper
 * @param {axios.Method} method
 * @param {string} url
 * @param {any} data
 * @param {axios.AxiosRequestConfig} options
 * @returns {Promise<axios.AxiosResponse<T>>}
 */
const requestWrapper = (method, url, data = undefined, options = undefined) => {
	if (defaultMethods.includes(method)) {
		return instance[method](url, options);
	}
	if (mutatingMethods.includes(method)) {
		return instance[method](url, data, options);
	}
	if (otherMethods.includes(method)) {
		return instance[method](options);
	}
	throw new Error('unsupported method', { method });
};

/**
 * Get request wrapper
 * @param {string} url
 * @param {axios.AxiosRequestConfig} options
 * @returns {Promise<axios.AxiosResponse<T>>}
 */
const get = (url, options) => {
	return requestWrapper('get', url, undefined, options);
};

/**
 * Post request wrapper
 * @param {string} url
 * @param {any} data
 * @param {axios.AxiosRequestConfig} options
 * @returns {Promise<axios.AxiosResponse<T>>}
 */
const post = (url, data, options) => {
	return requestWrapper('post', url, data, options);
};

/**
 * Request wrapper
 * @param {axios.AxiosRequestConfig} options
 * @returns {Promise<axios.AxiosResponse<T>>}
 */
const request = (options) => {
	return requestWrapper('request', undefined, undefined, options);
};

// TODO check usage
module.exports = { get, post, request };
