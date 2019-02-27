const auth = require('feathers-authentication');
const logger = require('../../../logger/');

const isGroup = e => !undefined && typeof e === 'object' && e.type === 'group' && e.users;
const mapUsers = users => users.data.map((user) => {
	return {
		userId: user._id.toString(),
		name: `${user.firstName} ${user.lastName}`,
	};
});

const addUsers = (context, key) => context.app.service('users').find({
	query: { _id: { $in: key ? context.result[key].users : context.result.users } },
}).then((u) => {
	if (key) {
		context.result[key].users = mapUsers(u);
	} else {
		context.result.users = mapUsers(u);
	}
	return context;
}).catch(() => {
	logger.warn('Can not populate user information');
});

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

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		passRequestDataToParams,
		saveAndClearQuery,
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [extractFindData],
	get: [populateUsers],
	create: [populateUsers],
	update: [],
	patch: [populateUsers],
	remove: [],
};
