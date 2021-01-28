const pseudonymModel = require('../src/services/pseudonym/model');
// eslint-disable-next-line no-unused-vars
const { alert } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

const syncIndexes = async () => {
	await connect();
	alert('start updating pseudonym indexes...');
	await pseudonymModel.syncIndexes();
	alert('finished updating pseudonym indexes...');
	await close();
};

module.exports = {
	up: async function up() {
		const duplicates = [];
		alert('start searching for duplicated pseudonyms');
		const duplicatedDocuments = pseudonymModel
			.aggregate([
				{
					$group: {
						_id: { toolId: '$toolId', userId: '$userId' },
						dups: { $addToSet: '$_id' },
						count: { $sum: 1 },
					},
				},
				{
					$match: {
						count: { $gt: 1 },
					},
				},
			])
			.cursor()
			.exec();
		alert('finished searching for duplicated pseudonyms');

		alert('start collecting documents which should be deleted');
		alert(duplicatedDocuments);
		duplicatedDocuments.eachAsync((document) => {
			document.dups.shift(); // First element skipped for deleting
			document.dups.forEach((id) => {
				duplicates.push(id);
			});
		});
		alert('finished collecting documents which should be deleted');

		alert('start deleting duplicated pseudonyms');
		pseudonymModel.remove({ _id: { $in: duplicates }});
		alert('finished deleting duplicated pseudonyms');

		await syncIndexes();
	},

	down: async function down() {
		await syncIndexes();
	},
};
