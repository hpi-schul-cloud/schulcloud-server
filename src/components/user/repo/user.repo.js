const { userModel: User } = require('../../../services/user/model');

const getUser = async (id, app) => {
	const modelService = app.service('usersModel');
	const user = await modelService.get(id);
	return user;
};

const deleteUser = async (id, app) => {
	return { success: true };
}

const replaceUserWithTombstone = async (id, app, replaceData = {}) => {
	const modelService = app.service('usersModel');
	const user = await modelService.get(id);

	return User.replaceOne(
		{ _id: user._id },
		{
			...replaceData,
			deletedAt: new Date(),
		});
};

module.exports = {
	getUser,
	replaceUserWithTombstone,
	deleteUser,
};
