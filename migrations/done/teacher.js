/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = true; // set to true to exclude migration
const name = 'Fix access rights for teachers on homework submitted files.';

const database = require('../../src/utils/database');

const { submissionModel } = require('../../src/services/homework/model.js');
const { FileModel } = require('../../src/services/fileStorage/model.js');

const run = async (dry) => {
	database.connect();

	const errorHandler = (e) => {
		console.log('Error', e);
		return undefined;
	};

	const submissionWithFiles = await submissionModel
		.find({ fileIds: { $exists: true, $not: { $size: 0 } } })
		.populate('homeworkId')
		.populate('fileIds')
		.exec()
		.catch(errorHandler);

	if (!submissionWithFiles.length) {
		return Promise.resolve();
	}

	const promises = submissionWithFiles.map((sub) => {
		const { teacherId } = sub.homeworkId || {};

		if (!teacherId) {
			return Promise.resolve();
		}

		const buggyFiles = sub.fileIds.filter(
			(file) => !file.permissions.find((perm) => perm.refId && perm.refId.toString() === teacherId.toString())
		);

		if (!buggyFiles.length) {
			return Promise.resolve();
		}

		console.log('Update permissions of files:');
		console.log(buggyFiles.map((file) => file._id));
		console.log(`with access rights for teacher: ${teacherId}`);

		const filePromises = buggyFiles.map((file) =>
			dry
				? Promise.resolve()
				: FileModel.update(
						{ _id: file._id },
						{
							$set: {
								permissions: [
									...file.permissions,
									{
										refId: teacherId,
										refPermModel: 'user',
										write: false,
										read: true,
										create: false,
										delete: false,
									},
								],
							},
						}
				  )
						.exec()
						.catch(errorHandler)
		);

		return Promise.all(filePromises);
	});

	return Promise.all(promises);
};

module.exports = {
	ran,
	name,
	run,
};
