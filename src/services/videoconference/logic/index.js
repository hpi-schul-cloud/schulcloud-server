// const rp = require('request-promise-native');
// const xml2js = require('xml2js-es6-promise');
const { error } = require('../../../logger');
const { ROLES } = require('./constants');
const utils = require('./utils');

const logErrorAndThrow = (message, response) => {
	error(message, response);
	throw new Error(message);
};

/**
 * creates a url for attendee or moderator to join a meeting.
 * if the meeting does not exist, it will be created.
 *
 * @returns join url
 */
exports.createMeeting = (
	server, meetingName, meetingId, userName, role, params,
) => server.monitoring
	.getMeetingInfo(meetingId)
	.then((meeting) => {
		const { response } = meeting;
		if (!meeting || !response) {
			throw new Error('error contacting bbb/server');
		}
		// the meeting already exist...
		if (utils.isValidFoundResponse(response)) {
			return meeting;
		}
		// the meeting does not exist, create it...
		if (utils.isValidNotFoundResponse(response)) {
			return server.administration
				.create(meetingName, meetingId, params);
		}
		throw new Error('error in setup the meeting, retry...?');
	})
	.then((meeting) => {
		// here we probably have a meeting, add user to the meeting...
		const { response } = meeting;
		if (!meeting || !response) {
			throw new Error('error contacting bbb/server');
		}
		if (!utils.isValidFoundResponse(response)) {
			const message = 'meeting room creation failed';
			error(message, response);
			throw new Error(message);
		}
		let secret;
		switch (role) {
			case ROLES.MODERATOR:
				if (!Array.isArray(response.moderatorPW) || !response.moderatorPW.length) {
					logErrorAndThrow('invalid moderator credentials', response);
				}
				secret = response.moderatorPW[0];
				break;
			case ROLES.ATTENDEE:
			default:
				if (!Array.isArray(response.attendeePW) || !response.attendeePW.length) {
					logErrorAndThrow('invalid attendee credentials', response);
				}
				secret = response.attendeePW[0];
		}

		if (!Array.isArray(response.meetingID) || !response.meetingID.length) {
			logErrorAndThrow('invalid meetingID', response);
		}
		const p = Object.assign({}, { redirect: false }, params);
		return server.administration.join(userName, response.meetingID[0], secret, p);
		// }) // todo add userId
		// .then((loginUrl) => {
		// 	const options = { resolveWithFullResponse: true };
		// 	return rp(loginUrl, options);
		// })		// retrieve a token based url from credential based url
		// .then(async (xmlResponse) => {
		// 	const { response } = await xml2js(xmlResponse.body);
		// 	if (response && response.url && Array.isArray(response.url) && response.url.length !== 0) {
		// 		const result = { url: response.url[0] };
		// 		if (xmlResponse.headers) {
		// 			result.session = getSessionCookieFromHeaders(xmlResponse.headers);
		// 		}
		// 		return result;
		// 	}
		// 	throw new Error('session token generation failed');
	});


/**
		 * @param {Server} server
		 * @param {String} meetingId
		 * @returns information about a meeting if the meeting exist.
		 * attention: this may expose sensitive data!
		 */
exports.getMeetingInfo = (server, meetingId) => server.monitoring
	.getMeetingInfo(meetingId).then((meeting) => {
		const { response } = meeting;
		if (!meeting || !response) {
			throw new Error('error contacting bbb/server');
		}
		if (utils.isValidFoundResponse(response) || utils.isValidNotFoundResponse(response)) {
			// valid response with not found or existing meeting
			return response;
		}
		throw new Error('unknown response from bbb...');
	});
