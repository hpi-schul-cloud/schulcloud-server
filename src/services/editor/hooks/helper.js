/* eslint-disable no-param-reassign */
const logger = require('../../../logger/');
const { userModel } = require('../../models');

const isGroup = e => e && e !== null && typeof e === 'object' && e.type === 'group' && e.users;

// eslint-disable-next-line arrow-body-style
const mapUsers = users => users.map(user => ({
	userId: user._id.toString(),
	name: `${user.firstName} ${user.lastName}`,
	roles: user.roles.map(role => role.name),
}));

const extractUsers = (context, key) => (key ? context.result[key].users : context.result.users);

const updateContext = (context, key, users) => {
	if (key) {
		context.result[key].users = mapUsers(users);
	} else {
		context.result.users = mapUsers(users);
	}
	return context;
};

const getUsers = userIds => userModel.find({ _id: { $in: userIds } })
	.select('roles firstName lastName')
	.populate('roles', 'name -_ids')
	.lean()
	.exec();

const populateUsersInContext = (context, key) => getUsers(extractUsers(context, key))
	.then(users => updateContext(context, key, users))
	.catch((err) => {
		logger.warn('Can not populate user.', err);
		return context;
	});

module.exports = {
	populateUsersInContext,
	isGroup,
};
