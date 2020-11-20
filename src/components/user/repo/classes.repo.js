const getService = (app) => {
	return app.service('classModel');
};

const getClasses = async (userId, app) => {
	const classes = await getService(app).find({
		query: {
			userIds: { $in: userId },
		},
		paginate: false,
	});
	return Array.isArray(classes) ? classes : [classes];
};

const removeStudentFromClasses = async (userId, userClassIds, app) => {
	const removePromises = userClassIds.map((classId) =>
		getService(app).patch(classId, { $pull: { userIds: { $in: userId } } })
	);
	return Promise.all(removePromises);
};

module.exports = {
	find: getClasses,
	deleteUserRef: removeStudentFromClasses,
};
