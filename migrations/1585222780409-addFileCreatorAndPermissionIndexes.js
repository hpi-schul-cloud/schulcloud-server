const { info } = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const { FileModel } = require('../src/services/fileStorage/model');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		info('Updating files...');
		const allFiles = await FileModel.estimatedDocumentCount();
		const [filesWithOwnerPermissions, userOwnedFilesWithInvalidPermissions] = await Promise.all([
			FileModel.countDocuments({
				'permissions.0.refPermModel': 'user',
				'permissions.0.refId': { $exists: true },
			}).exec(),
			FileModel.countDocuments({
				refOwnerModel: 'user',
				'permissions.0.refPermModel': { $ne: 'user' },
			}).exec(),
		]);
		const filesToUpdate = filesWithOwnerPermissions + userOwnedFilesWithInvalidPermissions;
		info(`${allFiles} files exist. ${filesToUpdate} files have creator information.`);

		info('Adding "creator" attribute. This may take a while...');
		// This needs to be done before the additional indexes are created,
		// because we expect a lot of updates
		await FileModel.updateMany(
			{
				'permissions.0.refPermModel': 'user',
				'permissions.0.refId': { $exists: true },
			},
			[{ $set: { creator: { $arrayElemAt: ['$permissions.refId', 0] } } }]
		);
		info('Done.');

		info('Updating file indexes...');
		// Creates an indexes for creator and permissions.refId/refPermModel
		await FileModel.syncIndexes();
		info('Done.');

		info('Adding "creator" attribute for inconsistent user-owned files...');
		// This will be faster here, because there's an index on creator and we
		// don't expect many files to be updated
		await FileModel.updateMany(
			{
				refOwnerModel: 'user',
				creator: { $exists: false },
			},
			[{ $set: { creator: '$owner' } }]
		);
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
