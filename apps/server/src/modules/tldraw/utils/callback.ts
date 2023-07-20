import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import lodash from 'lodash';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Timeout, GeneralError } from '@feathersjs/errors';
import { WSSharedDoc } from '@src/modules/tldraw/utils';
import { DataToSend, RequestOptions, TldrawAxiosResponse } from '../types';

const CALLBACK_URL = (Configuration.has('TLDRAW_CALLBACK_URL') ? Configuration.get('TLDRAW_CALLBACK_URL') : '') as URL;
const CALLBACK_TIMEOUT: number = (
	Configuration.has('TLDRAW_CALLBACK_TIMEOUT') ? Configuration.get('TLDRAW_CALLBACK_TIMEOUT') : 5000
) as number;
const CALLBACK_OBJECTS = Configuration.get('TLDRAW_CALLBACK_OBJ') as Map<string, unknown>;

/**
 * Take axios response and convert into internal response format
 * @private
 * @param {TldrawAxiosResponse} response like axios response defined in request wrapper
 */
function transformResponse({ config, data, headers, request, status, statusText }: TldrawAxiosResponse) {
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
function transformErrorResponse(error: AxiosError) {
	if (error.response) {
		// we got a non-200 response which can be responded but will still be thrown
		throw new GeneralError('response error', transformResponse(error.response as TldrawAxiosResponse));
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
 * @param {URL} url
 * @param {number} timeout
 * @param {DataToSend} data
 */
const callbackRequest = (url: URL, timeout: number, data: DataToSend) => {
	const dataStr = JSON.stringify(data);
	const axiosClient = axios.create();

	const options: RequestOptions = {
		hostname: url.hostname,
		port: url.port,
		path: url.pathname,
		timeout,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': String(dataStr.length),
		},
	};

	const requestOptions = lodash.merge({ ...url, ...options }) as AxiosRequestConfig;
	axiosClient
		.request(requestOptions)
		.then((response) => transformResponse(response as TldrawAxiosResponse))
		.catch(transformErrorResponse);
};

/**
 * @param {string} objName
 * @param {string} objType
 * @param {WSSharedDoc} doc
 */
const getContent = (objName: string, objType: string, doc: WSSharedDoc): { [p: string]: any } | string => {
	switch (objType) {
		case 'Array':
			return doc.getArray(objName).toJSON() as string[];
		case 'Map':
			return doc.getMap(objName).toJSON();
		case 'Text':
			return doc.getText(objName).toJSON();
		case 'XmlFragment':
			return doc.getXmlFragment(objName).toJSON();
		default:
			return {};
	}
};

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
export const callbackHandler = (update: Uint8Array, origin, doc: WSSharedDoc) => {
	const room = doc.name;
	const dataToSend: DataToSend = {
		room,
		data: null,
	};
	const sharedObjectList = Object.keys(CALLBACK_OBJECTS);
	sharedObjectList.forEach((sharedObjectName) => {
		const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName] as string;
		if (dataToSend.data) {
			dataToSend.data[sharedObjectName] = {
				type: sharedObjectType,
				content: getContent(sharedObjectName, sharedObjectType, doc),
			};
		}
	});
	callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend);
};
