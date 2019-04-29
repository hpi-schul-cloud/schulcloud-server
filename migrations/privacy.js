/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = false; // set to true to exclude migration
const name = 'Add privacy access rights for users.';

const database = require('../src/utils/database');

const RoleModel = require('../src/services/role/model');


const run = async () => {
	database.connect();

	const userRoles = await RoleModel.find({ name: { $in: ['user', 'demo'] } }).exec();
	const addPermissions = ['PRIVACY_VIEW'];

	return Promise.all(userRoles.map(userRole => Promise.all(addPermissions.map((permission) => {
		if (!userRole.permissions.includes(permission)) {
			console.log(`add permission ${permission} for userrole ${userRole.name}`);
			return RoleModel
				.findByIdAndUpdate(userRole._id,
					{ $push: { permissions: permission } })
				.exec();
		}
		console.log(`${permission} already exists for userRole ${userRole.name}`);
		return Promise.resolve();
	}))));
};

module.exports = {
	ran,
	name,
	run,
};
