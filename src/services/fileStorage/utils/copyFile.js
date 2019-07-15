const { BadRequest, NotFound } = require('@feathersjs/errors');
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

const copyFile = async (data, params, permissionHandler) => {
	// file = sourceFileId  | parent = newCourseId
	const { file, parent } = data;
	const { payload: { userId } } = params;
	const strategy = createCorrectStrategy(params.payload.fileStorageType);

	if (!file || !parent) {
		return Promise.reject(new BadRequest('Missing parameters'));
	}

	// existingFile must rename
	const [existingFile, fileObject] = await Promise.all([
		FileModel.findOne({ parent, name: file.name }).lean().exec(),
		FileModel.findOne({ _id: file }).lean().exec(),
	]);

	if (!fileObject) {
		throw new NotFound('The file was not found!');
	}

	const newFileObject = {
		owner: parent,
	};
	// check that there's no file with this name in course
	if (existingFile !== null) {
		const [ext, name] = file.name.split('.').reverse();
		newFileObject.name = `${name}_${Date.now()}.${ext}`;
	}

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
