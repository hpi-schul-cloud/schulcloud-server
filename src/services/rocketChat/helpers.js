const { Configuration } = require('@hpi-schul-cloud/commons');
const { ROCKET_CHAT_URI, ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID } = require('../../../config/globals');

/**
 * create a valid options object to call a rocketChat request.
 * @param {String} shortUri Uri of the Rocket.Chat endpoint. Example: '/api/v1/users.register'
 * @param {Object} body Body of the request, as required by the rocket.chat API
 * @param {Boolean} asAdmin If true, request will be sent with admin privileges,
 * and auth field will be ignored.
 * @param {Object} auth optional, object of the form {authToken, userId}.
 * @param {String} method the REST method to be called. Example: 'POST'.
 */
exports.getRequestOptions = (shortUri, body, asAdmin, auth, method) => {
	let headers;
	if (asAdmin) {
		headers = {
			'X-Auth-Token': ROCKET_CHAT_ADMIN_TOKEN,
			'X-User-ID': ROCKET_CHAT_ADMIN_ID,
		};
	} else if (auth) {
		headers = {
			'X-Auth-Token': auth.authToken,
			'X-User-ID': auth.userId,
		};
	}
	return {
		uri: ROCKET_CHAT_URI + shortUri,
		method: method || 'POST',
		body,
		headers,
		json: true,
		timeout: Configuration.get('REQUEST_TIMEOUT'),
	};
};

/**
 * returns a valid string for rocket chat usernames, channelnames, and the like.
 * Invalid characters in the input string are replaced with valid ones.
 * @param {String} input
 * @returns {String} a valid string for use in rocketChat.
 */
exports.makeStringRCConform = (input) => {
	const dict = {
		ä: 'ae',
		Ä: 'Ae',
		ö: 'oe',
		Ö: 'Oe',
		ü: 'ue',
		Ü: 'Ue',
		' ': '-',
		ß: 'ss',
	};
	const inputResolvedUmlauts = input.replace(/[äÄöÖüÜß ]/g, (match) => dict[match]);
	return inputResolvedUmlauts.replace(/[^\w\d.\-_]/g, '_');
};
