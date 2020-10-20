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

/**
 * @typedef {Object} RequestOptions
 * @param {axios.RequestMethod} method
 * @param {string} url the request url
 * @param {string?} baseURL will be prefixed in front of url, if defined
 * @param {Object} data
 * @param {Object} params query params
 * @param {Object?} headers
 * @param {boolean} resolveWithFullResponse by default returns response.data, set true to retrieve full response
 * @param {string} contentType will set header contentType, 'x-www-form-urlencoded' will transform data from json to form urlencoded
 */

/**
 * Request options wrapper to transform BL decisions for the library axios currently used
 * @param {RequestOptions} options
 */
const transformOptions = ({
	method = 'GET',
	url,
	baseURL,
	data,
	headers = {},
	params,
	responseType = 'json', // or 'arraybuffer'
	contentType = undefined, // or 'x-www-form-urlencoded'
	resolveWithFullResponse = false, // prefer not to set this true
}) => {
	/**
	 * @type axios.AxiosRequestConfig
	 */
	const axiosOptions = {
		// take properties without transformation
		headers,
		baseURL,
		params,
		// by default, returns response.data
		resolveWithFullResponse,
	};

	// assign optional parameters without transformation
	Object.assign(axiosOptions, method && { method }, url && { url }, data && { data });

	// set responseType
	if (['json', 'arraybuffer'].includes(responseType)) {
		Object.assign(axiosOptions, { responseType });
	} else {
		throw new Error('unsupported responseType', { responseType });
	}

	// set contentType
	if (contentType === 'x-www-form-urlencoded') {
		// set header and transform data object
		Object.assign(axiosOptions.headers, { contentType });
		axiosOptions.data = qs.stringify(data);
	} else if (contentType !== undefined) {
		throw new Error('unsupported contentType', { contentType });
	}

	return axiosOptions;
};

/**
 * Request wrapper
 * @param {axios.Method} method
 * @param {string} url
 * @param {any} data
 * @param {RequestOptions} options
 * @returns {Promise<axios.AxiosResponse<T>>}
 */
const requestWrapper = (options) => {
	const axiosOptions = transformOptions(options);
	return instance.request(axiosOptions).then(({ config, data, headers, request, status, statusText }) => {
		if (config.resolveWithFullResponse === true) {
			return {
				options: config,
				data,
				headers,
				request,
				status,
				statusText,
			};
		}
		return data;
	});
};

module.exports = {
	/**
	 * Get request wrapper, returning json response data
	 * @param {string} url
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 */
	get: (url, options) => {
		return requestWrapper({ ...options, url, method: 'GET' });
	},

	/**
	 * Post request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 */
	post: (url, data, options) => {
		return requestWrapper({ ...options, url, data, method: 'POST' });
	},

	/**
	 * Put request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 */
	put: (url, data, options) => {
		return requestWrapper({ ...options, url, data, method: 'PUT' });
	},

	/**
	 * Patch request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 */
	patch: (url, data, options) => {
		return requestWrapper({ ...options, url, data, method: 'PATCH' });
	},

	/**
	 * Delete request wrapper, returning json response data
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 */
	delete: (url, options) => {
		// axios.delete does not support data to be added into options, use request instead
		return requestWrapper({ ...options, url, method: 'DELETE' });
	},

	/**
	 * Generic request wrapper, returning json response data
	 * @param {RequestOptions} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 */
	request: (options) => {
		return requestWrapper(options);
	},
};
