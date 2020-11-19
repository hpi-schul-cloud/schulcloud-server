const { userModel: User } = require('../../../services/user/model');

const getService = (app) => {
	return app.service('usersModel');
}

const getUser = async (id, app) => {
	return getService(app).get(id);
};

const replaceUserWithTombstone = async (id, replaceData = {}, app) => {
	const user = await getUser(id, app);

	return User.replaceOne(
		{ _id: user._id },
		{
			...replaceData,
			deletedAt: new Date(),
		}
	);
};

const getUserRoles = async (id, app) => {
	const { roles } = await getService(app).get(id, {
		query: {
			$populate: ['roles'],
		},
	});
	return roles;
};

module.exports = {
	getUser,
	getUserRoles,
	replaceUserWithTombstone,
};
