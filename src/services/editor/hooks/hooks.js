/* eslint-disable no-param-reassign */
const logger = require('winston');
const { populateUsersInContext, isGroup } = require('./helper');

/**
 * Populate each user displayName for groups or keys that contain populated groups.
 */
const populateUsers = async (context) => {
	const { result } = context;
	// todo populate id to {id, name:user.firstname+' '+user.lastname}
	if (isGroup(result)) {
		return populateUsersInContext(context);
	}

	// todo update later to own request that contain all users and after it replace it with each id.
	const wait = [];
	Object.keys(result).forEach((key) => {
		if (isGroup(result[key])) {
			wait.push(populateUsersInContext(context, key));
		}
	});

	return Promise.all(wait).then(() => context);
};

const passRequestDataToParams = (context) => {
	context.params.request = {
		method: context.method,
		id: context.id,
		data: context.data,
	};

	try {
		context.params.request.userId = context.params.account.userId.toString();
	} catch (err) {
		context.params.request.userId = 'unknown';
	}
	return context;
};

const extractFindData = (context) => {
	context.result = context.result.data;
	return context;
};

/**
 * No query parameter should pass to the Editor MircoService.
 * If any need, it added by the endpoints im server editor service.
 * But if you need any, the query is saved in params.clientQuery.
 */
const saveAndClearQuery = (context) => {
	context.params.clientQuery = context.params.query;
	context.params.query = {};
	return context;
};

module.exports = {
	populateUsers,
	passRequestDataToParams,
	extractFindData,
	saveAndClearQuery,
};
