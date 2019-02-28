/* eslint-disable no-param-reassign */
const logger = require('../../../logger/');

const isGroup = e => !undefined && typeof e === 'object' && e.type === 'group' && e.users;

// eslint-disable-next-line arrow-body-style
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

module.exports = {
	addUsers,
	isGroup,
};
