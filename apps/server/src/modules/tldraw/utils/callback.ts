import * as http from "http";
import axios, { AxiosResponse } from 'axios';
import lodash from "lodash";
import { Configuration } from '@hpi-schul-cloud/commons';
import { Timeout, GeneralError } from '@feathersjs/errors';
const CALLBACK_URL = Configuration.get('FEATURE_TLDRAW_CALLBACK_URL') as string ? new URL(Configuration.get('FEATURE_TLDRAW_CALLBACK_URL')) : null;
const CALLBACK_TIMEOUT = Configuration.get('FEATURE_TLDRAW_CALLBACK_TIMEOUT') ?? 5000;
const CALLBACK_OBJECTS = Configuration.get('FEATURE_TLDRAW_CALLBACK_OBJ') ? JSON.parse(Configuration.get('FEATURE_TLDRAW_CALLBACK_OBJ')) : {};

export const isCallbackSet = !!CALLBACK_URL;

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
export const callbackHandler = (update, origin, doc) => {
	const room = doc.name;
	const dataToSend = {
		room,
		data: {}
	};
	const sharedObjectList = Object.keys(CALLBACK_OBJECTS);
	sharedObjectList.forEach(sharedObjectName => {
		const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName];
		dataToSend.data[sharedObjectName] = {
			type: sharedObjectType,
			content: getContent(sharedObjectName, sharedObjectType, doc).toJSON(),
		}
	});
	callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend);
}

/**
 * @param {URL} url
 * @param {number} timeout
 * @param {Object} data
 */
const callbackRequest = (url, timeout, data) => {
	data = JSON.stringify(data);
	const axiosClient = axios.create();

	const options = {
		hostname: url.hostname,
		port: url.port,
		path: url.pathname,
		timeout,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': data.length
		}
	};

	const requestOptions = lodash.merge({ ...url, ...options });
	axiosClient.request(requestOptions).then(transformResponse).catch(transformErrorResponse);
}

/**
 * Take axios response and convert into internal response format
 * @private
 * @param config
 * @param data
 * @param headers
 * @param request
 * @param status
 * @param statusText
 */
function transformResponse({ config, data, headers, request, status, statusText }: AxiosResponse) {
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
function transformErrorResponse(error) {
	if (error.response) {
		// we got a non-200 response which can be responded but will still be thrown
		throw this.transformResponse(error.response);
	}
	if (error.request) {
		// The request was made but no response was received
		// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
		// http.ClientRequest in node.js
		throw new Timeout('external api request timeout');
	} else {
		// Something happened in setting up the request that triggered an Error
		throw new GeneralError('external api reuqest error', error);
	}
}

/**
 * @param {string} objName
 * @param {string} objType
 * @param {WSSharedDoc} doc
 */
const getContent = (objName, objType, doc) => {
	switch (objType) {
		case 'Array': return doc.getArray(objName);
		case 'Map': return doc.getMap(objName);
		case 'Text': return doc.getText(objName);
		case 'XmlFragment': return doc.getXmlFragment(objName);
		case 'XmlElement': return doc.getXmlElement(objName);
		default : return {};
	}
}
