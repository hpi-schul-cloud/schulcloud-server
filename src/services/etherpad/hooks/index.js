const padHooks = require('./Pad');
const sessionHooks = require('./Session');
const activeSessionsHooks = require('./ActiveSessions');
const groupHooks = require('./Group');
const authorHooks = require('./Author');

module.exports = {
	padHooks,
	sessionHooks,
	groupHooks,
	authorHooks,
	activeSessionsHooks,
};
