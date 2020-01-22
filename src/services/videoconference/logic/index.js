const rp = require('request-promise-native');
const xml2js = require('xml2js-es6-promise');
const { error } = require('../../../logger');
const {
	MESSAGE_KEYS, RETURN_CODES, ROLES, GUEST_POLICIES,
} = require('./constants');

const createParams = { allowStartStopRecording: false, guestPolicy: GUEST_POLICIES.ALWAYS_DENY };

/**
 * responseheaders will be evaluated to have a set-cookie valuecontaining a jsessionid
 * @param {*} headers
 */
const getSessionCookieFromHeaders = (headers) => {
	if (headers && headers['set-cookie'] && Array.isArray(headers['set-cookie'])) {
		return headers['set-cookie'].find((cookie) => String(cookie).startsWith('JSESSIONID'));
	}
	return undefined;
};

/**
 * creates a url for attendee or moderator to join a meeting.
 * if the meeting does not exist, it will be created.
 *
 * @returns join url
 */
exports.joinMeeting = (server, meetingName, meetingId, userName, role, params) => server.monitoring
	// TODO instead recreation should be possible
	.getMeetingInfo(meetingId)
	.then((meeting) => {
		const { response } = meeting;
		if (!meeting || !response) {
			throw new Error('error contacting bbb/server');
		}
		// the meeting already exist...
		if (Array.isArray(response.returncode) && response.returncode.includes(RETURN_CODES.SUCCESS)) {
			return meeting;
		}
		// the meeting does not exist, create it...
		if (Array.isArray(response.messageKey) && response.messageKey.includes(MESSAGE_KEYS.NOT_FOUND)) {
			return server.administration
				.create(meetingName, meetingId, createParams);
		}
		throw new Error('error in setup the meeting, retry...?');
	})
	.then((meeting) => {
		// here we probably have a meeting, add user to the meeting...
		const { response } = meeting;
		if (!meeting || !response) {
			throw new Error('error contacting bbb/server');
		}
		if (!Array.isArray(response.returncode) || !response.returncode.includes(RETURN_CODES.SUCCESS)) {
			const message = 'meeting room creation failed';
			error(message, response);
			throw new Error(message);
		}
		let secret;
		switch (role) {
			case ROLES.MODERATOR:
				if (!Array.isArray(response.moderatorPW) || !response.moderatorPW.length) {
					throw new Error('invalid moderator credentials');
				}
				secret = response.moderatorPW[0];
				break;
			case ROLES.ATTENDEE:
			default:
				if (!Array.isArray(response.attendeePW) || !response.attendeePW.length) {
					throw new Error('invalid attendee credentials');
				}
				secret = response.attendeePW[0];
		}

		if (!Array.isArray(response.meetingID) || !response.meetingID.length) {
			throw new Error('invalid meetingID');
		}
		const p = Object.assign({}, { redirect: false }, params);
		return server.administration.join(userName, response.meetingID[0], secret, p);
	}) // todo add userId
	.then((loginUrl) => {
		const options = { resolveWithFullResponse: true };
		return rp(loginUrl, options);
	})		// retrieve a token based url from credential based url
	.then(async (xmlResponse) => {
		const { response } = await xml2js(xmlResponse.body);
		if (response && response.url && Array.isArray(response.url) && response.url.length !== 0) {
			const result = { url: response.url[0] };
			if (xmlResponse.headers) {
				result.session = getSessionCookieFromHeaders(xmlResponse.headers);
			}
			return result;
		}
		throw new Error('session token generation failed');
	});

/**
	 * returns information about a meeting if the meeting exist.
	 * only successful responses are valid responses this method will be returned
	 * returns false on not found
	 * attention: this may expose sensitive data!
	 */
exports.getMeetingInfo = (server, meetingId) => server.monitoring
	.getMeetingInfo(meetingId).then((meeting) => {
		const { response } = meeting;
		if (!meeting || !response) {
			throw new Error('error contacting bbb/server');
		}
		if (Array.isArray(response.returncode) && response.returncode.includes(RETURN_CODES.SUCCESS)) {
			// meeting exist, got valid response
			return response;
		}
		if (Array.isArray(response.messageKey) && response.messageKey.includes(MESSAGE_KEYS.NOT_FOUND)) {
			// meeting does not exist
			return false;
		}
		throw new Error('unknown response from bbb...');
	});
