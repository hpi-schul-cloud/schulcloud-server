const { SC_DOMAIN } = require('../../../../config/globals');

/** Key to separate different Instances on BBB LB */
exports.ORIGIN_SERVER_NAME = SC_DOMAIN;

const roles = { MODERATOR: 'moderator', ATTENDEE: 'attendee' };
exports.ROLES = roles;

const responseStatus = { SUCCESS: 'SUCCESS', ERROR: 'ERROR' };
exports.RESPONSE_STATUS = responseStatus;

const messageKeys = { NOT_FOUND: 'notFound' };
exports.MESSAGE_KEYS = messageKeys;

const permissions = {
	/**
	 * join a meeting as normal user.
	 */
	JOIN_MEETING: 'JOIN_MEETING', // todo rename in migration
	/**
	 * the first user must start a meeting.
	 * This is a precondition for other users which only need to have permission to ATTEND_MEETING.
	 */
	START_MEETING: 'START_MEETING',
};
exports.PERMISSIONS = permissions;

const scopeNames = {
	COURSE: 'course',
	EVENT: 'event',
};
exports.SCOPE_NAMES = scopeNames;

const states = {
	NOT_STARTED: 'NOT_STARTED',
	RUNNING: 'RUNNING',
	FINISHED: 'FINISHED',
};
exports.STATES = states;

const createOptionToggles = {
	MODERATOR_MUST_APPROVE_JOIN_REQUESTS: 'moderatorMustApproveJoinRequests',
	EVERYBODY_JOINS_AS_MODERATOR: 'everybodyJoinsAsModerator',
	EVERY_ATTENDEE_JOINS_MUTED: 'everyAttendeJoinsMuted', // TODO: Fix string value "attendee" here and in client
};
exports.CREATE_OPTION_TOGGLES = createOptionToggles;
