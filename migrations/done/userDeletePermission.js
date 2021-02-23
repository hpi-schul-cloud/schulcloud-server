/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = false; // set to true to exclude migration
const name = 'Add Permissions to delete Users.';

const database = require('../src/utils/database');

const RoleModel = require('../src/services/role/model');

const run = async () => {
	console.log('console is working!');
	database.connect();

	const userRoles = await RoleModel.find({ name: { $in: ['teacher', 'administrator'] } }).exec();
	const addTeacherPermissions = ['STUDENT_DELETE'];
	const addAdminPermissions = ['STUDENT_DELETE', 'TEACHER_DELETE'];

	const chain = [];

	const addPermissions = (permissionArray, userRole) => {
		Promise.all(
			permissionArray.map((permission) => {
				if (!userRole.permissions.includes(permission)) {
					console.log(`add permission ${permission} for userrole ${userRole.name}`);
					return RoleModel.findByIdAndUpdate(userRole._id, { $push: { permissions: permission } }).exec();
				}
				console.log(`${permission} already exists for userRole ${userRole.name}`);
				return Promise.resolve();
			})
		);
	};

	// update user roles/permissions
	chain.push(
		userRoles.map((userRole) => {
			if (userRole.name === 'teacher') {
				return addPermissions(addTeacherPermissions, userRole);
			}
			if (userRole.name === 'administrator') {
				return addPermissions(addAdminPermissions, userRole);
			}
			return Promise.reject(new Error('unexpected Role'));
		})
	);

	return Promise.all(chain);
};

module.exports = {
	ran,
	name,
	run,
};
