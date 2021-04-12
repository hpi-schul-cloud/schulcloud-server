const { canWrite, canRead, canCreate, canDelete } = require('./filePermissionHelper');

const { returnFileType, generateFileNameSuffix: generateFlatFileName } = require('./filePathHelper');

const copyFile = require('./copyFile');
const createCorrectStrategy = require('./createCorrectStrategy');

const { createPermission, createDefaultPermissions } = require('./createDefaultPermissions');

module.exports = {
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
