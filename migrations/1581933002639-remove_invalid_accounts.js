const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Account = mongoose.model(
	'accountsforremoveaccounts',
	new mongoose.Schema(
		{
			userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
			activated: { type: Boolean, default: false },
		},
		{
			timestamps: true,
		}
	),
	'accounts'
);

const User = mongoose.model(
	'usersforremoveaccounts',
	new mongoose.Schema(
		{
			userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
			activated: { type: Boolean, default: false },
		},
		{
			timestamps: true,
		}
	),
	'users'
);

const Role = mongoose.model(
	'rolesforremoveaccounts',
	new mongoose.Schema({
		name: { type: String, required: true },
	}),
	'roles'
);

const Backup = mongoose.model(
	'backupforremoveaccounts',
	new mongoose.Schema({
		type: { type: String, required: true, enum: ['account', 'user'] },
		object: { type: Object },
	}),
	'backup_invalid_accounts_2_20'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const invalidAccounts = await Account.find({
			userId: { $exists: false },
		})
			.lean()
			.exec();

		const { _id: parentRoleId } = await Role.findOne({ name: 'parent' }).exec();
		const { _id: expertRoleId } = await Role.findOne({ name: 'expert' }).exec();

		const invalidUsers = await User.aggregate([
			{
				$lookup: {
					from: 'accounts',
					localField: '_id',
					foreignField: 'userId',
					as: 'account',
				},
			},
			{
				$match: {
					'account.userId': {
						$exists: false,
					},
					roles: {
						$not: {
							$in: [parentRoleId, expertRoleId],
						},
					},
					importHash: {
						$exists: false,
					},
				},
			},
		]).exec();

		const promises = [];
		invalidAccounts.forEach(async (acc) => {
			promises.push(
				Backup.create({
					type: 'account',
					object: acc,
				})
			);
			promises.push(Account.findByIdAndRemove(acc._id));
		});
		info(invalidUsers);
		invalidUsers.forEach(async (user) => {
			promises.push(
				Backup.create({
					type: 'user',
					object: user,
				})
			);
			promises.push(User.findByIdAndRemove(user._id));
		});
		await Promise.all(promises);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		info(
			'the accounts and users cant be restored automatically. ' +
				'If restoration is required, refer to the collection "backup_invalid_accounts_2_20"'
		);
	},
};
