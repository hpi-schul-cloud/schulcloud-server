const { canWrite, canRead, canCreate, canDelete } = require('./filePermissionHelper');

const { returnFileType, generateFileNameSuffix } = require('./filePathHelper');

const createCorrectStrategy = require('./createCorrectStrategy');

const { createPermission, createDefaultPermissions } = require('./createDefaultPermissions');

module.exports = {
	canWrite,
	canRead,
	canCreate,
	canDelete,
	returnFileType,
	generateFileNameSuffix,
	createCorrectStrategy,
	createPermission,
	createDefaultPermissions,
};
