const { NotFound, BadRequest } = require('../../../errors');
const { FileModel } = require('../model');

const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { generateFileNameSuffix } = require('./filePathHelper');
const { createDefaultPermissions } = require('./createDefaultPermissions');
const { canRead } = require('./filePermissionHelper');

const safeOverrideAndClear = (source, override) => {
	Object.keys(override).forEach((key) => {
		source[key] = override[key];
	});
	delete source._id;
	delete source.updateAt;
	delete source.createAt;
	return source;
};

const checkUserWritePermissionOnCourse = (userId, courseId, app) => {
	const course = app.service('courses').get(courseId);
	if (!course) {
		throw new NotFound('The course was not found!');
	}
	let result = false;
	if ((course.teacherIds || []).some((u) => equalIds(u, userId))) result = true;
	if ((course.substitutionIds || []).some((u) => equalIds(u, userId))) result = true;

	return result;
};

exports.copyCourseFile = async ({ fileId, targetCourseId, userId, strategy }, app) => {
	if (!fileId || !targetCourseId) {
		return Promise.reject(new BadRequest('Missing parameters'));
	}

	checkUserWritePermissionOnCourse(userId, targetCourseId, app);
	await canRead(userId, fileId);

	const fileObject = await FileModel.findOne({ _id: fileId }).lean().exec();
	if (!fileObject) {
		throw new NotFound('The file was not found!');
	}

	const newFileObject = {
		name: fileObject.name,
		owner: targetCourseId,
		creator: userId,
	};
	newFileObject.permissions = await createDefaultPermissions(userId, 'course');

	// unclear wether this is needed
	// renameFileIfAlreadyExistInParent(existingFile, newFileObject);

	const user = app.service('users').get(userId);
	// this part is blindly copied from old service
	newFileObject.storageFileName = generateFileNameSuffix(newFileObject.name || fileObject.name);
	await strategy.copyFile(userId, fileObject.storageFileName, newFileObject.storageFileName, user.schoolId);
	const file = await FileModel.create(safeOverrideAndClear(fileObject, newFileObject));

	return {
		orginalId: fileId,
		copy: file,
	};
};
