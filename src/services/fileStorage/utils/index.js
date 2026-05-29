const { canWrite, canRead, canCreate, canDelete } = require('./filePermissionHelper');

const { returnFileType, generateFileNameSuffix } = require('./filePathHelper');

const { createPermission, createDefaultPermissions } = require('./createDefaultPermissions');

module.exports = {
	canWrite,
	canRead,
	canCreate,
	canDelete,
	returnFileType,
	generateFileNameSuffix,
	createPermission,
	createDefaultPermissions,
};
