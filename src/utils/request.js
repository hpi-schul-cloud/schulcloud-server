const axios = require('axios');
const { Configuration } = require('@schul-cloud/commons');

/**
 * @type {axios.AxiosRequestConfig}
 */
const defaultOptions = {
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

module.exports = {
	/**
	 * Get request wrapper
	 * @param {string} url
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	get: (url, options) => {
		return requestWrapper('get', url, undefined, options);
	},

	/**
	 * Post request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	post: (url, data, options) => {
		return requestWrapper('post', url, data, options);
	},

	/**
	 * Post request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	put: (url, data, options) => {
		return requestWrapper('put', url, data, options);
	},

	/**
	 * Delete request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	delete: (url, options) => {
		return requestWrapper('post', url, options);
	},

	/**
	 * Generic request wrapper
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	request: (options) => {
		return requestWrapper('request', undefined, undefined, options);
	},
};
