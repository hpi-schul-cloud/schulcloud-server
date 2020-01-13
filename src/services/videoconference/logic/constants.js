const roles = { MODERATOR: 'moderator', ATTENDEE: 'attendee' };
exports.ROLES = roles;

const returnCodes = { SUCCESS: 'SUCCESS', FAILED: 'FAILED' };
exports.RETURN_CODES = returnCodes;

const messageKeys = { NOT_FOUND: 'notFound' };
exports.MESSAGE_KEYS = messageKeys;

const permissions = { MODERATE_MEETING: 'MODERATE_MEETING', ATTEND_MEETING: 'ATTEND_MEETING' };
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
