const axios = require('axios');
const qs = require('qs');
const lodash = require('lodash');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { Timeout, GeneralError } = require('../errors');

module.exports = class ApiHelper {
	/**
	 * Create a request wrapper with default options to be applied on every instance request
	 * @param {axios.AxiosRequestConfig} options
	 */
	constructor(options = {}) {
		this.instanceOptions = options;
		this.axios = axios.create();
	}

	/**
	 * creates default options during runtime
	 * @returns {axios.AxiosRequestConfig}
	 */
	static defaultOptions() {
		return {
			paramsSerializer: (paramsObj) => {
				// use custom params serializer based on qs as it supports nested objects
				const serializedParams = qs.stringify(paramsObj);
				return serializedParams;
			},
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};
	}

	/**
	 * Take axios response and convert into internal response format
	 * @param {axios.AxiosResponse} response like axios response defined in request wrappeår
	 * @private
	 */
	transformResponse({ config, data, headers, request, status, statusText }) {
		// return internal response format
		return {
			config,
			data,
			headers,
			request,
			status,
			statusText,
		};
	}

	/**
	 * Transform axios response to internal format
	 * @private
	 */
	transformErrorResponse(error) {
		if (error.response) {
			// we got a non-200 response which can be responded but will still be thrown
			throw this.transformResponse(error.response);
		}
		if (error.request) {
			// The request was made but no response was received
			// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
			// http.ClientRequest in node.js
			throw new Timeout('external api request timeout', error.request);
		} else {
			// Something happened in setting up the request that triggered an Error
			throw new GeneralError('external api reuqest error', error);
		}
	}

	/**
	 * Starts a request based on default, instance and request options merged.
	 * Responses and response errors are transformed
	 * @param {axios.Method} method
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 * @private
	 */
	requestWrapper(options) {
		const requestOptions = lodash.merge({ ...ApiHelper.defaultOptions(), ...this.instanceOptions, ...options });
		return this.axios.request(requestOptions).then(this.transformResponse).catch(this.transformErrorResponse);
	}

	/**
	 * Get request wrapper
	 * @param {string} url
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 * @protected
	 */
	get(url, options) {
		return this.requestWrapper({ ...options, url, method: 'GET' });
	}

	/**
	 * Post request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
     * @protected

	 */
	post(url, data, options) {
		return this.requestWrapper({ ...options, url, data, method: 'POST' });
	}

	/**
	 * Put request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 * @protected
	 */
	put(url, data, options) {
		return this.requestWrapper({ ...options, url, data, method: 'PUT' });
	}

	/**
	 * Patch request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 * @protected
	 */
	patch(url, data, options) {
		return this.requestWrapper({ ...options, url, data, method: 'PATCH' });
	}

	/**
	 * Delete request wrapper
	 * @param {string} url
	 * @param {any} data
	 * @param {RequestOptions} options
	 * @returns {Promise<any>}
	 * @protected
	 */
	delete(url, options) {
		// axios.delete does not support data to be added into options, use request instead
		return this.requestWrapper({ ...options, url, method: 'DELETE' });
	}

	/**
	 * Generic request wrapper
	 * @param {RequestOptions} options
	 * @returns {Promise<axios.AxiosResponse<T>>}
	 * @protected
	 */
	request(options) {
		return this.requestWrapper(options);
	}
};
