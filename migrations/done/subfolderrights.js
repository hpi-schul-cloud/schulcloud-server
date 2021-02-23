/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = true; // set to true to exclude migration
const name = 'Add permission for students to create files in course subfolders.';

const database = require('../../src/utils/database');

const RoleModel = require('../../src/services/role/model');
const { FileModel } = require('../../src/services/fileStorage/model.js');

const run = async (dry) => {
	database.connect();

	const errorHandler = (e) => {
		console.log('Error', e);
		return undefined;
	};

	const { _id: studentRoleId } = await RoleModel.findOne({ name: 'student' }).lean().exec();

	const courseFolders = await FileModel.find({
		isDirectory: true,
		refOwnerModel: 'course',
	})
		.lean()
		.exec()
		.catch(errorHandler);

	if (!courseFolders.length) {
		return Promise.resolve();
	}

	const promises = courseFolders.map((dir) => {
		const { permissions, _id } = dir;
		const studentPermissions = permissions.find(({ refId }) => refId && refId.equals(studentRoleId));

		if (!studentPermissions.create) {
			studentPermissions.create = true;
			return !dry
				? FileModel.update(
						{ _id },
						{
							$set: { permissions },
						}
				  ).exec()
				: Promise.resolve();
		}

		return Promise.resolve();
	});

	return Promise.all(promises);
};

module.exports = {
	ran,
	name,
	run,
};
