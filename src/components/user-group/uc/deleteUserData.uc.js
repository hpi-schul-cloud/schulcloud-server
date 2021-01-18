const { ValidationError } = require('../../../errors');
const { classesRepo } = require('../repo/index');
const { trashBinResult } = require('../../helper/uc.helper');
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
	let complete = true;
	const classes = await classesRepo.getClassesForUser(userId);
	debug(`found ${classes.length} classes with contents of given user to be removed`, { userId });
	const data = {};
	if (classes.length !== 0) {
		addClassesToTrashbinData(classes, data);
		const result = await classesRepo.removeUserFromClasses(userId);
		complete = result.success;
		debug(`removed user from ${result.modifiedDocuments} classes`, { userId });
	}
	debug(`deleting user mentions in classes contents finished`, { userId });
	return trashBinResult({ scope: 'classes', data, complete });
};

// public
const deleteUserData = () => [deleteUserDataFromClasses];

module.exports = { deleteUserData };
