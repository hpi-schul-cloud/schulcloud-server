const axios = require('axios');
const qs = require('qs');
const { Configuration } = require('@schul-cloud/commons');

/**
 * @type {axios.AxiosRequestConfig}
 */
const defaultOptions = {
	timeout: Configuration.get('REQUEST_TIMEOUT_MILLIS'),
	paramsSerializer: (params) => {
		// use custom params serializer based on qs as it supports nested objects
		const serializedParams = qs.stringify(params);
		return serializedParams;
	},
};
const instance = axios.create(defaultOptions);

const defaultMethods = ['get', 'delete', 'head', 'options'];
const mutatingMethods = ['post', 'put', 'patch'];
const otherMethods = ['request'];

const getResponseData = (response) => response.data;

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
	 * Get request wrapper, returning json response data
	 * @param {string} url
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<any>}
	 */
	get: (url, options) => {
		return requestWrapper('get', url, undefined, options).then(getResponseData);
	},

	/**
	 * Post request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<any>}
	 */
	post: (url, data, options) => {
		return requestWrapper('post', url, data, options).then(getResponseData);
	},

	/**
	 * Put request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<any>}
	 */
	put: (url, data, options) => {
		return requestWrapper('put', url, data, options).then(getResponseData);
	},

	/**
	 * Patch request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<any>}
	 */
	patch: (url, data, options) => {
		return requestWrapper('patch', url, data, options).then(getResponseData);
	},

	/**
	 * Delete request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<any>}
	 */
	delete: (url, options) => {
		// axios.delete does not support data to be added into options, use request instead
		return requestWrapper('request', undefined, undefined, { ...options, url, method: 'DELETE' }).then(getResponseData);
	},

	/**
	 * Generic request wrapper, returning plain response
	 * @param {axios.AxiosRequestConfig} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	request: (options) => {
		return requestWrapper('request', undefined, undefined, options);
	},
};
