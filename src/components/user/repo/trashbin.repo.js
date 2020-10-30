
const createUserTrashbin = async (user, app) => {
	const modelService = app.service('trashbinModel');
	const data = {
		userId: user._id,
		documentId: user._id,
		document: JSON.stringify(user),
		deletedAt: new Date(),
	};
	return modelService.create(data);
};

const updateUserTrashbin = () => {
	// access trashbin model
};

module.exports = {
	createUserTrashbin,
	updateUserTrashbin,
};
