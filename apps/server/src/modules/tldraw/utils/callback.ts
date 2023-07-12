import * as http from "http";
import { Configuration } from '@hpi-schul-cloud/commons';

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
	const req = http.request(options);
	req.on('timeout', () => {
		console.warn('Callback request timed out.');
		req.abort();
	})
	req.on('error', (e) => {
		console.error('Callback request error.', e);
		req.abort();
	})
	req.write(data);
	req.end();
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
