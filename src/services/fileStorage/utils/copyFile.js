const { BadRequest, NotFound, NotAcceptable } = require('@feathersjs/errors');
const { FileModel } = require('../model');
const createCorrectStrategy = require('./createCorrectStrategy');
const { generateFileNameSuffix } = require('./filePathHelper');
const { createDefaultPermissions } = require('./createDefaultPermissions');

const safeOverrideAndClear = (source, override) => {
	Object.keys(override).forEach((key) => {
		source[key] = override[key];
	});
	delete source._id;
	delete source.updateAt;
	delete source.createAt;
	return source;
};

// check that there's no file with this name in course
const renameFileIfAlreadyExistInParent = (existingFile, newFileObject) => {
	if (existingFile !== null) {
		if (!existingFile.name) {
			throw new NotAcceptable('File name test is fail.');
		}
		const [name, extension, others] = existingFile.name.split('.');
		if (!others) { // found more then 2 elements after split
			throw new NotAcceptable('File with points in name is not valid file name.');
		}
		newFileObject.name = `${name}_${Date.now()}.${extension}`;
	}
};

/**
 * @param {Object} {file, parent} file = sourceFileId  | parent = newCourseId
 * @param {Object} params
 * @param {Function} [ permissionHandler ] <optional> permissionHandler(userId, file, parent)
 */
const copyFile = async ({ file, parent }, params, permissionHandler) => {
	const { payload: { userId } } = params;
	const strategy = createCorrectStrategy(params.payload.fileStorageType);

	if (!file || !parent) {
		return Promise.reject(new BadRequest('Missing parameters'));
	}

	// existingFile must rename
	const [existingFile, fileObject] = await Promise.all([
		// only select name to reduce traffic
		FileModel.findOne({ parent, name: file.name }).select('name').lean().exec(),
		FileModel.findOne({ _id: file }).lean().exec(),
	]);

	if (!fileObject) {
		throw new NotFound('The file was not found!');
	}

	const newFileObject = {
		owner: parent,
	};

	renameFileIfAlreadyExistInParent(existingFile, newFileObject);

	// check permissions
	if (permissionHandler) {
		await permissionHandler(userId, file, parent);
	} else {
		// first step for intern call, for extern must validate later
		// todo: should studentCanCreate fetch from sourceCourse?
		newFileObject.permissions = createDefaultPermissions(userId, 'course');
	}
	// copy file on external storage
	newFileObject.storageFileName = generateFileNameSuffix(newFileObject.name || fileObject.name);
	// copy file into bucket from user schoolId
	await strategy.copyFile(userId, fileObject.storageFileName, newFileObject.storageFileName);
	return FileModel.create(safeOverrideAndClear(fileObject, newFileObject));
};

module.exports = copyFile;
