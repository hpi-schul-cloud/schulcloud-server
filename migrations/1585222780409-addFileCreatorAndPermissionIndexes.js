const { info } = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const { FileModel } = require('../src/services/fileStorage/model');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		info('Updating files...');
		const allFiles = await FileModel.estimatedDocumentCount();
		const filesToUpdate = await FileModel.countDocuments({
			'permissions.0.refPermModel': 'user',
			'permissions.0.refId': { $exists: true },
		}).exec();
		info(`${allFiles} files exist. ${filesToUpdate} files have creator information.`);

		info('Adding "creator" attribute. This may take a while...');
		await FileModel.updateMany({
			'permissions.0.refPermModel': 'user',
			'permissions.0.refId': { $exists: true },
		}, [
			{ $set: { creator: { $arrayElemAt: ['$permissions.refId', 0] } } },
		]);
		info('Done.');

		info('Updating file indexes...');
		await FileModel.syncIndexes();
		info('Done.');
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		info('Removing the creator field...');
		await FileModel.updateMany({ $unset: { creator: true } }).exec();
		info('Done.');

		info('Updating file indexes...');
		await FileModel.syncIndexes();
		info('Done.');
		// ////////////////////////////////////////////////////
		await close();
	},
};
