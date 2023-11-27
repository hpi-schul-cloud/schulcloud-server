const { canWrite, canRead, canCreate, canDelete } = require('./filePermissionHelper');

const { returnFileType, generateFileNameSuffix } = require('./filePathHelper');

const copyFile = require('./copyFile');
const createCorrectStrategy = require('./createCorrectStrategy');

const { createPermission, createDefaultPermissions } = require('./createDefaultPermissions');

module.exports = {
	canWrite,
	canRead,
	canCreate,
	canDelete,
	returnFileType,
	generateFileNameSuffix,
	copyFile,
	createCorrectStrategy,
	createPermission,
	createDefaultPermissions,
};
