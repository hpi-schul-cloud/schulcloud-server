
const getUserToDelete = (id, app) => {
	const modelService = app.service('usersModel');
	return modelService.get(id);
};

const deleteUser = async (id, app) => {
	return { success: true };
};

const generateDummyEmail = () => {
	const rnd = () => Math.round(Math.random() * 10000);
	return `deleted_${Date.now()}_${rnd()}@mustermann.de`;
};

const replaceUserWithTombstone = async (id, app) => {
	return app.service('usersModel').update(id, {
		email: generateDummyEmail(),
		firstName: 'DELETED',
		lastName: 'DELETED',
		deletedAt: new Date(),
	});
};

module.exports = {
	replaceUserWithTombstone,
	getUserToDelete,
	deleteUser,
};
