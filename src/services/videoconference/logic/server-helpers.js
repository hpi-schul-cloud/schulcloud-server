const { NotFound } = require('@feathersjs/errors');
const { error } = require('../../../logger');
const { ROLES } = require('./constants');
const utils = require('./utils');

const logErrorAndThrow = (message, response, ErrorClass = Error) => {
	error(message, response);
	throw new ErrorClass(message);
};

const createMeeting = async (server, id, name, params) => server.administration
	.create(name, id, params)
	.then((meeting = {}) => {
		const { response } = meeting;

		if (!utils.isValidFoundResponse(response)) {
			logErrorAndThrow('meeting room creation failed', response);
		}

		return meeting;
	});

exports.ensureMeetingExists = async (server, id, name, params, create = false) => server.monitoring
	.getMeetingInfo(id)
	.then((meeting = {}) => {
		const { response } = meeting;

		if (utils.isValidNotFoundResponse(response)) {
			if (create) {
				return createMeeting(server, id, name, params);
			}

			return logErrorAndThrow('meeting room not found, create missing', response, NotFound);
		}

		return meeting;
	});

/**
 * Create a URL for an attendee or moderator to join a meeting.
 * If the meeting does not exist, it will be created if create set true.
 *
 * @returns join URL
 */
exports.joinMeeting = async (server, meeting, userName, role, params) => {
	const { response } = meeting;

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

	const [meetingID] = response.meetingID;

	return server.administration.join(userName, meetingID, secret, params);
};

/**
 * @param {Server} server
 * @param {String} meetingId
 *
 * @returns information about a meeting if the meeting exist
 *
 * Attention: this may expose sensitive data!
 */
exports.getMeetingInfo = (server, meetingId) => server.monitoring
	.getMeetingInfo(meetingId)
	.then(({ response } = {}) => {
		if (utils.isValidFoundResponse(response) || utils.isValidNotFoundResponse(response)) {
			// valid response with not found or existing meeting
			return response;
		}
		error('unknown bbb response', response);
		throw new Error('unknown response from bbb...');
	});
