const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;

const School = mongoose.model(
	'schools202312111053',
	new mongoose.Schema(
		{
			systems: [{ type: Schema.Types.ObjectId, ref: 'system' }],
			federalState: { type: Schema.Types.ObjectId, ref: 'federalstate' },
		},
		{
			timestamps: true,
		}
	),
	'schools'
);

const FederalState = mongoose.model(
	'federalState202312111053',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
		},
		{
			timestamps: true,
		}
	),
	'federalstates'
);

module.exports = {
	up: async function up() {
		await connect();

		await School.updateMany(
			{
				systems: { $exists: false },
			},
			{
				systems: [],
			}
		)
			.lean()
			.exec();

		const tenant = process.env.SC_THEME;
		let federalStateName = 'Brandenburg';
		if (tenant !== 'n21') {
			federalStateName = 'Niedersachsen';
		} else if (tenant === 'brb') {
			federalStateName = 'Brandenburg';
		} else if (tenant === 'thr') {
			federalStateName = 'Thüringen';
		}

		const federalState = await FederalState.findOne({ name: federalStateName }).lean().exec();

		await School.updateMany(
			{
				federalState: { $exists: false },
			},
			{
				federalState: federalState._id,
			}
		)
			.lean()
			.exec();

		await close();
	},
};
