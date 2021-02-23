const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const { Schema } = mongoose;
const thingSchema = new Schema({}, { strict: false });
const File = mongoose.model('files4324532', thingSchema, 'files');
const BrokenFile = mongoose.model('brokenFiles', thingSchema);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		let movedFiles = 0;

		const copyAndRemove = async (file) => {
			info(`remove file ${String(file._id)} of user ${String(file.owner)} from files...`);
			const fileCopy = file.toObject();
			const copy = new BrokenFile(fileCopy);
			await copy.save();
			info('copy created, remove origin...');
			await file.remove();
			info('origin has been removed.');
			movedFiles += 1;
			info(`already handled ${movedFiles}...`);
		};

		const fileAmount = await File.countDocuments();

		// find files with missing names
		const brokenFiles = await File.find({ name: { $exists: false } }).exec();
		if (brokenFiles) {
			info(`found ${brokenFiles.length} files without filename...`);
			for (const file of brokenFiles) {
				await copyAndRemove(file);
			}
		} else {
			info('no files without filename found...');
		}

		// find files with undefined storageFileName and not directory
		const undefinedStorageFileNameNotDirectory = await File.find({
			storageFileName: 'undefined',
			isDirectory: false,
		}).exec();
		if (undefinedStorageFileNameNotDirectory) {
			info(
				`found ${undefinedStorageFileNameNotDirectory.length}` + ' files with undefinedStorageFileNameNotDirectory...'
			);
			for (const file of undefinedStorageFileNameNotDirectory) {
				await copyAndRemove(file);
			}
		} else {
			info('no files with "undefined" storageFileName found...');
		}

		info(`all in all, moved ${movedFiles} files`);

		const newFileAmount = await File.countDocuments();
		const brokenFileAmount = await BrokenFile.countDocuments();

		if (movedFiles === newFileAmount && newFileAmount + brokenFileAmount !== fileAmount) {
			error('file amount do not match!', {
				movedFiles,
				newFileAmount,
				fileAmount,
				brokenFileAmount,
			});
		} else {
			info('stats', {
				movedFiles,
				newFileAmount,
				fileAmount,
				brokenFileAmount,
			});
		}

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		error('manual rollback required');
		// ////////////////////////////////////////////////////
		await close();
	},
};
