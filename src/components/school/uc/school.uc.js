const schoolRepo = require('../repo/school.repo');
const { Forbidden } = require('../../../errors');
const { SCHOOL_OF_DELETE_USERS_NAME } = require('../repo/db');

const getSchool = async (id) => schoolRepo.getSchool(id);

const getTombstoneSchool = async () => {
	const tombstoneSchool = await schoolRepo.findSchools({ name: SCHOOL_OF_DELETE_USERS_NAME });
	return tombstoneSchool[0];
};

const updateSchool = async (schoolId, schoolPatch) => schoolRepo.updateSchool(schoolId, schoolPatch);

const checkPermissions = (schoolId, permissionToCheck, user) => {
	let grantPermission = true;
	// same school?
	grantPermission = grantPermission && user.schoolId.toString() === schoolId.toString();

	// user has permission
	grantPermission =
		grantPermission &&
		user.roles.some((role) => role.permissions.some((permission) => permission === permissionToCheck));

	if (!grantPermission) {
		throw new Forbidden(`You don't have permissions to perform this action`);
	}
};

module.exports = {
	getSchool,
	getTombstoneSchool,
	updateSchool,
	checkPermissions,
};
