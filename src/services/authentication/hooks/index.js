const { discard } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const { extractJwtData } = require('../../../utils/extractJwtData');

const populateResult = (hook) => {
	hook.result.userId = hook.result.account.userId; // required by event listeners
	return hook;
};

/**
 * Requests need to be used after authentication as inner server calls
 * Provider is not allowed to be set to detect it as inner server call
 */
const removeProvider = (context) => {
	delete context.params.provider;
	return context;
};

const addJwtToWhitelist = async (context) => {
	const jwtWhiteListAdapter = context.app.service('nest-jwt-whitelist-adapter');
	const { accountId, jti } = extractJwtData(context.result.accessToken);

	await jwtWhiteListAdapter.addToWhitelist(accountId, jti);

	return context;
};

const removeJwtFromWhitelist = async (context) => {
	const jwtWhiteListAdapter = context.app.service('nest-jwt-whitelist-adapter');
	const { accountId, jti } = extractJwtData(context.params.authentication.accessToken);

	await jwtWhiteListAdapter.removeFromWhitelist(accountId, jti);

	return context;
};

const checkJwtAuthWhitelisted = async (context) => {
	const { strategy, accessToken } = context.data;
	if (strategy === 'jwt') {
		const jwtWhiteListAdapter = context.app.service('nest-jwt-whitelist-adapter');
		const { accountId, jti } = extractJwtData(accessToken);

		await jwtWhiteListAdapter.isWhitelisted(accountId, jti);
	}

	return context;
};

const hooks = {
	before: {
		create: [checkJwtAuthWhitelisted, globalHooks.blockDisposableEmail('username'), removeProvider],
		remove: [removeProvider],
	},
	after: {
		all: [discard('account.password'), globalHooks.transformToDataTransferObject],
		create: [addJwtToWhitelist],
		remove: [populateResult, removeJwtFromWhitelist],
	},
};

module.exports = { hooks, removeJwtFromWhitelist, addJwtToWhitelist };
