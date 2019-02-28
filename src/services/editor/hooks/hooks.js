/* eslint-disable no-param-reassign */
const { MethodNotAllowed } = require('feathers-errors');
const { addUsers, isGroup } = require('./helper');

/**
 * Populate each user displayName for groups or keys that contain populated groups.
 */
const populateUsers = async (context) => {
	const { result } = context;
	// todo populate id to {id, name:user.firstname+' '+user.lastname}
	if (isGroup(result)) {
		return addUsers(context);
	}

	const wait = [];
	Object.values(result).forEach((key) => {
		if (isGroup(result[key])) {
			wait.push(addUsers(context, result[key].users, key));
		}
	});

	return Promise.all(wait).then(() => context);
};

const passRequestDataToParams = (context) => {
	context.params.request = {
		method: context.method,
		userId: context.params.account.userId.toString(),
		id: context.id,
		data: context.data,
	};
	return context;
};

const extractFindData = (context) => {
	context.result = context.result.data;
	return context;
};

const block = () => {
	throw new MethodNotAllowed('Use patch instant.');
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
	block,
	saveAndClearQuery,
};
