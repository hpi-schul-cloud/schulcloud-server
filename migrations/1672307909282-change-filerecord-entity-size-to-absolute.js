const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const FileRecord = mongoose.model(
	'changeFilerecordEntitySizeToLong',
	new mongoose.Schema(
		{
			size: { type: Number, required: true },
		},
		{
			timestamps: true,
		}
	),
	'filerecords'
);

module.exports = {
	up: async function up() {
		await connect();
		const result = await FileRecord.updateMany(
			{},
			{
				$set: { size: { $toLong: '$size' } },
			}
		).exec();
		alert(`Update filerecords.size to absolute: ${JSON.stringify(result)}`);
		await close();
	},

	down: async function down() {
		alert(`Is nothing to rollback`);
	},
};
