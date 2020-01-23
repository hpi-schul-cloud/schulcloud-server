const roles = { MODERATOR: 'moderator', ATTENDEE: 'attendee' };
exports.ROLES = roles;

const returnCodes = { SUCCESS: 'SUCCESS', FAILED: 'FAILED' };
exports.RETURN_CODES = returnCodes;

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
	/**
	 * create meeting metadata locally, which is aq precondition to START_MEETING.
	 */
	CREATE_MEETING: 'CREATE_MEETING',
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
