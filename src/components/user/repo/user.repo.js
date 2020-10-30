const getUserToDelete = (id, app) => {
	const modelService = app.service('usersModel');
	return modelService.get(id);
};

const deleteUser = async (id, app) => {
	return { success: true };
};

const generateDummyEmail = () => {
	const rnd = () => Math.round(Math.random() * 10000);
	return `new_deleted_${Date.now()}_${rnd()}@mustermann.de`;
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
		// schoolId: user.schoolId,
	};
	// eslint-disable-next-line guard-for-in
	for (const i in user) {
		user[i] = null;
	}
	Object.assign(userTombstone, user, tombstoneTemplate);
	return userTombstone;
};

const replaceUserWithTombstone = async (user, app) => {
	const userId = user._id;
	return app
		.service('usersModel')
		.update(userId, createUserTombstone(user));
};

module.exports = {
	replaceUserWithTombstone,
	getUserToDelete,
	deleteUser,
};
