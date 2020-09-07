const mongoose = require('mongoose');

const { Schema } = mongoose;
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const ConsentVersion = mongoose.model(
	'consentVersions_20200805',
	new mongoose.Schema({
		consentTypes: [
			{
				type: String,
				required: true,
				index: true,
			},
		],
		consentText: { type: String, required: true },
		// create request that include consentData, create a new base64Files entries and pass the id to consentDataId
		consentDataId: { type: Schema.Types.ObjectId, ref: 'base64Files' },
		schoolId: { type: Schema.Types.ObjectId, index: true },
		publishedAt: { type: Date, required: true, index: true },
		title: { type: String, required: true },
	}),
	'consentversions'
);

module.exports = {
	up: async function up() {
		await connect();
		await ConsentVersion.syncIndexes();
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		logger.log('indeces was not removed');
		// ////////////////////////////////////////////////////
		await close();
	},
};
