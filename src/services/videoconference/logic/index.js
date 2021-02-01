// const rp = require('request-promise-native');
// const xml2js = require('xml2js-es6-promise');

const { NotFound, AssertionError } = require('../../../errors');
const { requiredParametersToBeNonEmtyString } = require('../../../errors/helper/assertionErrorHelper');
const { error } = require('../../../logger');
const { ROLES } = require('./constants');
const utils = require('./utils');

const logErrorAndThrow = (message, response, ErrorClass = Error) => {
	error(message, response);
	throw new ErrorClass(message);
};

const validateIsNonEmptyString = (text) => {
	if (typeof text !== 'string' || text.length <= 0) {
		throw new AssertionError(requiredParametersToBeNonEmtyString({ text }));
	}
};
const sanitize = (text, replacement = '') => {
	validateIsNonEmptyString(text);
	// keep only space, upper-/lowercase letters, numbers and accented letters
	// see https://unicode-table.com/en/#ipa-extensions for ordered characters list
	const regex = /[^0-9A-Za-zÀ-ÖØ-öø-ÿ.\-=_'`´ ]/g;
	const sanitizedText = text.replace(regex, replacement);
	return sanitizedText;
};
exports.sanitize = sanitize;

/**
 * creates a url for attendee or moderator to join a meeting.
 * if the meeting does not exist, it will be created if create set true.
 *
 * @returns join url
 * @param {Boolean} create
 */
const joinMeeting = (server, meetingName, meetingId, userName, role, params, create = false) =>
	server.monitoring
		.getMeetingInfo(meetingId)
		.then((meeting = {}) => {
			const { response } = meeting;
			// the meeting does not exist, create it...
			if (utils.isValidNotFoundResponse(response)) {
				if (create === true) {
					return server.administration.create(sanitize(meetingName), meetingId, params);
				}
				return logErrorAndThrow('meeting room not found, create missing', response, NotFound);
			}
			// the meeting probably already exist, use it...
			return meeting;
		})
		.then((meeting) => {
			// here we probably have a meeting, add user to the meeting...
			const { response } = meeting;

			if (!utils.isValidFoundResponse(response)) {
				const message = 'meeting room creation failed';
				logErrorAndThrow(message, response);
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
			return server.administration.join(sanitize(userName), response.meetingID[0], secret, params);
		});
exports.joinMeeting = joinMeeting;

/**
 * @param {Server} server
 * @param {String} meetingId
 * @returns information about a meeting if the meeting exist.
 * attention: this may expose sensitive data!
 */
exports.getMeetingInfo = (server, meetingId) =>
	server.monitoring.getMeetingInfo(meetingId).then((meeting = {}) => {
		const { response } = meeting;
		if (utils.isValidFoundResponse(response) || utils.isValidNotFoundResponse(response)) {
			// valid response with not found or existing meeting
			return response;
		}
		error('unknown bbb response', meeting);
		throw new Error('unknown response from bbb...');
	});
