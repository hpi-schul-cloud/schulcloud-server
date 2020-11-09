const { userModel: User } = require('../../../services/user/model');

const getUser = (id, app) => {
	const modelService = app.service('usersModel');
	return modelService.get(id);
};

const replaceUserWithTombstone = async (id, app, replaceData = {}) => {
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
