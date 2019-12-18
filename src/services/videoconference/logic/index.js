const { error } = require('../../../logger');
const { MESSAGE_KEYS, RETURN_CODES, ROLES } = require('./constants');

const createParams = {};

/**
 * creates a url for attendee or moderator to join a meeting.
 * if the meeting does not exist, it will be created.
 *
 * @returns join url
 */
exports.joinMeeting = (server, meetingName, meetingId, userName, role) => server.monitoring
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
		return server.administration.join(userName, response.meetingID[0], secret); // todo add userId
	});

/**
	 * returns information about a meeting if the meeting exist.
	 * only successful responses or not found error are valid responses this method will be returned
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
			// meeting does not exist, got valid response
			return response;
		}
		throw new Error('unknown response from bbb...');
	});
