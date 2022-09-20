const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');
const { alert } = require('../src/logger');

const splitToChunks = (array, parts) => {
	const result = [];
	// eslint-disable-next-line no-plusplus
	for (let i = parts; i > 0; i--) {
		const part = array.splice(0, Math.ceil(array.length / i));
		if (part.length > 0) {
			result.push(part);
		}
	}
	return result;
};

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const User = mongoose.model('users220825', new mongoose.Schema({}), 'users');
const Account = mongoose.model('accounts220825', new mongoose.Schema({}), 'accounts');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// - Only use models declared in the migration.
		// - Make sure your migration is idempotent. It is not guaranteed to run only once!
		// - Avoid any unnecessary references, including environment variables. If you have to run the migration on a single instance, use SC_THEME.

		const results = await User.aggregate([
			{
				$match: {
					$or: [
						{ email: { $regex: /tombstone-(0x|0h)?[0-9A-F]{24}/i } },
						{ email: { $regex: /(0x|0h)?[0-9A-F]{24}@deleted/i } },
					],
				},
			},
			{
				$lookup: {
					from: 'accounts',
					localField: '_id',
					foreignField: 'userId',
					as: 'accounts-without-users',
				},
			},
			{
				$match: { 'accounts-without-users': { $exists: true, $not: { $size: 0 } } },
			},
			{
				$project: { _id: 1 },
			},
		]).exec();
		const count = results.length;
		const userIds = results.map((i) => i._id);
		const chunks = splitToChunks(userIds, 100);
		const promises = chunks.map((chunkOfUserIds) => Account.deleteMany({ userId: { $in: chunkOfUserIds } }));
		await Promise.all(promises);
		await close();
		alert(`Cleanup of accounts to deleted users is successfully: Count ${count}`);
	},
	down: async function down() {
		alert(`Is nothing to rollback`);
	},
};
