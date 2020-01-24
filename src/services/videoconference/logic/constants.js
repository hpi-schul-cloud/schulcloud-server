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

const guestPolicies = {
	ALWAYS_ACCEPT: 'ALWAYS_ACCEPT',
	ALWAYS_DENY: 'ALWAYS_DENY',
	ASK_MODERATOR: 'ASK_MODERATOR',
};
exports.GUEST_POLICIES = guestPolicies;

const scopeNames = {
	COURSE: 'course',
};
exports.SCOPE_NAMES = scopeNames;

const states = {
	NOT_STARTED: 'NOT_STARTED',
	READY: 'READY',
	STARTED: 'STARTED,',
};
exports.STATES = states;

const createOptionToggles = {
	MODERATOR_MUST_APPROVE_JOIN_REQUESTS: 'moderatorMustApproveJoinRequests',
	EVERYBODY_JOINS_AS_MODERATOR: 'everybodyJoinsAsModerator',
	EVERY_ATTENDY_JOINS_MUTED: 'everyAttendeJoinsMuted',
};
exports.CREATE_OPTION_TOGGLES = createOptionToggles;
