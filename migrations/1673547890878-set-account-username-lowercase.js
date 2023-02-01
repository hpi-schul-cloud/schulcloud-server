const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');
const { connect, close } = require('../src/utils/database');

const Account = mongoose.model('20230201-account', new mongoose.Schema({}), 'accounts');

module.exports = {
	up: async function up() {
		await connect();

		await Account.updateMany({}, [{ $set: { username: { $toLower: '$username' } } }])
			.lean()
			.exec();

		await close();
	},

	down: async function down() {
		alert(`No rollback`);
	},
};
