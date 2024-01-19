const mongoose = require('mongoose');
const { info, alert } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const ContextExternalTool = mongoose.model(
	'contextExternalTools202401041311',
	new mongoose.Schema(
		{
			parameters: [
				{
					name: { type: String, required: true },
					value: { type: String, required: false },
				},
			],
		},
		{
			timestamps: true,
		}
	),
	'context-external-tools'
);

const SchoolExternalTool = mongoose.model(
	'schoolExternalTools202401041311',
	new mongoose.Schema(
		{
			schoolParameters: [
				{
					name: { type: String, required: true },
					value: { type: String, required: false },
				},
			],
		},
		{
			timestamps: true,
		}
	),
	'school-external-tools'
);

module.exports = {
	up: async function up() {
		await connect();

		const contextExternalToolResponse = await ContextExternalTool.updateMany(
			{ $or: [{ 'parameters.value': undefined }, { 'parameters.value': '' }] },
			{
				$pull: {
					parameters: {
						$or: [{ value: undefined }, { value: '' }],
					},
				},
			}
		)
			.lean()
			.exec();

		info(`Removed ${contextExternalToolResponse.nModified} parameter(s) in context-external-tools`);

		const schoolExternalToolResponse = await SchoolExternalTool.updateMany(
			{ $or: [{ 'schoolParameters.value': undefined }, { 'schoolParameters.value': '' }] },
			{
				$pull: {
					schoolParameters: {
						$or: [{ value: undefined }, { value: '' }],
					},
				},
			}
		)
			.lean()
			.exec();

		info(`Removed ${schoolExternalToolResponse.nModified} parameter(s) in school-external-tools`);

		await close();
	},

	down: async function down() {
		alert('This migration cannot be undone');
	},
};
