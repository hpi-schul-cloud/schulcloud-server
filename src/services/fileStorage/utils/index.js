const {
	canWrite,
	canRead,
	canCreate,
	canDelete,
	canWriteFiles,
	canReadFiles,
	canCreateFiles,
	canDeleteFiles,
} = require('./filePermissionHelper');

const {
	returnFileType,
	generateFileNameSuffix: generateFlatFileName,
} = require('./filePathHelper');

const copyFile = require('./copyFile');
const createCorrectStrategy = require('./createCorrectStrategy');

const { createPermission, createDefaultPermissions } = require('./createDefaultPermissions');

module.exports = {
	canWriteFiles,
	canReadFiles,
	canCreateFiles,
	canDeleteFiles,
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
