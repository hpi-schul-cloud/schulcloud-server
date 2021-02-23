/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = false; // set to true to exclude migration
const name = 'Fix access rights for students on course directories.';

const database = require('../../src/utils/database');

const { FileModel } = require('../../src/services/fileStorage/model.js');
const RoleModel = require('../../src/services/role/model');

const run = async () => {
	database.connect();

	const errorHandler = (e) => {
		console.log('Error', e);
		return undefined;
	};

	const directories = await FileModel.find({
		isDirectory: true,
		refOwnerModel: 'course',
	})
		.exec()
		.catch(errorHandler);

	const { _id: studentRoleId } = await RoleModel.findOne({ name: 'student' }).exec();

	const promises = directories.map((dir) => {
		const { permissions } = dir;
		const missing = permissions
			.filter(({ refPermModel }) => refPermModel === 'role')
			.every(({ refId }) => refId.toString() !== studentRoleId.toString());

		if (missing) {
			permissions.push({
				refId: studentRoleId,
				refPermModel: 'role',
				write: false,
				read: true,
				create: false,
				delete: false,
			});

			return FileModel.update({ _id: dir._id }, { permissions }).exec().catch(errorHandler);
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
