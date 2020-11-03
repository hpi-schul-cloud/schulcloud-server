const { userModel: User } = require('../../../services/user/model');

const getUser = async (id, app) => {
	const modelService = app.service('usersModel');
	const user = await modelService.get(id);
	return user;
};

const generateDummyEmail = () => {
	const rnd = () => Math.round(Math.random() * 10000);
	return `deleted_${Date.now()}_${rnd()}@mustermann.de`;
};

const createUserTombstone = (user) => {
	const userTombstone = {};
	const userId = user._id;

	const tombstoneTemplate = {
		_id: userId,
		email: generateDummyEmail(),
		firstName: 'DELETED',
		lastName: 'DELETED',
		deletedAt: new Date(),
		schoolId: user.schoolId,
	};
	// eslint-disable-next-line guard-for-in
	for (const i in user) {
		user[i] = null;
	}
	Object.assign(userTombstone, user, tombstoneTemplate);
	return userTombstone;
};

const deleteUser = async (id, app) => {
	return { success: true };
}
const replaceUserWithTombstoneMW = async (user, app) => {
	const userId = user._id;
	return app
		.service('usersModel')
		.update(userId, createUserTombstone(user));
};

const replaceUserWithTombstoneDR = async (id, app, replaceData = {}) => {
	const user = await getUser(id, app);

	return User.replaceOne(
		{ _id: user._id },
		{
			...replaceData,
			deletedAt: new Date(),
		});
};

module.exports = {
	getUser,
	replaceUserWithTombstoneMW,
	replaceUserWithTombstoneDR,
	deleteUser,
};
