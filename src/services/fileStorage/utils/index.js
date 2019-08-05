const {
	canWrite,
	canRead,
	canCreate,
	canDelete,
	writeFiles,
	readFiles,
	createFiles,
	deleteFiles,
} = require('./filePermissionHelper');

const {
	returnFileType,
	generateFileNameSuffix: generateFlatFileName,
} = require('./filePathHelper');

const copyFile = require('./copyFile');
const createCorrectStrategy = require('./createCorrectStrategy');

const { createPermission, createDefaultPermissions } = require('./createDefaultPermissions');

module.exports = {
	writeFiles,
	readFiles,
	createFiles,
	deleteFiles,
	canWrite,
	canRead,
	canCreate,
	canDelete,
	returnFileType,
	generateFlatFileName,
	copyFile,
	createCorrectStrategy,
	createPermission,
	createDefaultPermissions,
};
