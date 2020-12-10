const { ValidationError } = require('../../../errors');
const { classesRepo } = require('../repo/index');
const { isValid: isValidObjectId } = require('../../../helper/compare').ObjectId;
const { debug } = require('../../../logger');

const validateParams = (userId) => {
	if (!isValidObjectId(userId)) throw new ValidationError('a valid objectId is required', { userId });
};

const addClassesToTrashbinData = (classes = [], data) => {
	const student = classes.filter((classItem) => classItem.student).map((classItem) => classItem._id);
	const teacher = classes.filter((classItem) => classItem.teacher).map((classItem) => classItem._id);
	Object.assign(data, { classIds: { student, teacher } });
};

const deleteUserDataFromClasses = async (userId) => {
	validateParams(userId);
	debug(`deleting user mentions in classes contents started`, { userId });

	const classes = await classesRepo.getClassesForUser(userId);
	debug(`found ${classes.length} classes with contents of given user to be removed`, { userId });
	const data = {};
	if (classes.length !== 0) {
		addClassesToTrashbinData(classes, data);
		const result = await classesRepo.removeUserFromClasses(userId);
		debug(`removed user from ${result.matchedDocuments} classes`, { userId });
	}
	debug(`deleting user mentions in classes contents finished`, { userId });
	return { trashBinData: { scope: 'classes', data }, complete: true };
};

// public
const deleteUserData = () => {
	return [deleteUserDataFromClasses];
};

module.exports = { deleteUserData };
