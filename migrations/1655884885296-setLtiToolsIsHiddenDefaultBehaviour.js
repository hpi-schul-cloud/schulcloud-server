const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const LtiTool = mongoose.model(
	'ltiToolHiddenBehaviour',
	new mongoose.Schema(
		{
			isHidden: { type: Boolean, default: false },
		},
		{
			timestamps: true,
		}
	),
	'ltitools'
);

module.exports = {
	up: async function up() {
		await connect();

		await LtiTool.updateMany(
			{
				$or: [{ isHidden: { $exists: false } }, { isHidden: null }],
			},
			{
				$set: { isHidden: false },
			}
		).exec();

		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Nothing here.
		// ////////////////////////////////////////////////////
		await close();
	},
};
