const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const PasswordRecoveryModel = mongoose.model(
	'passwordRecoveryModel',
	new mongoose.Schema({
		account: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
		changed: { type: Boolean, default: false },
		token: { type: String, required: true, index: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	}),
	'passwordRecovery'
);

module.exports = {
	up: async function up() {
		await connect();

		await PasswordRecoveryModel.aggregate([
			{
				$addFields: {
					token: { $toString: '$_id' },
				},
			},
			{
				$out: 'passwordRecovery',
			},
		]);
		await close();
	},

	down: async function down() {
		await connect();
		await PasswordRecoveryModel.updateMany({}, { $unset: { token: 1 } });
		await close();
	},
};
