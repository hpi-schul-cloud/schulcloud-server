const { userModel: User } = require('../../../services/user/model');

const getUser = async (id, app) => {
	return app.service('users').get(id);
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

module.exports = {
	getUser,
	replaceUserWithTombstone,
};
