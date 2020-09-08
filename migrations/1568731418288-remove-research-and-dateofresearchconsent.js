const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');

const ConsentModel = mongoose.model(
	'consent',
	new mongoose.Schema({
		userConsent: {
			researchConsent: { type: Boolean },
			dateOfResearchConsent: { type: Date },
		},
		parentConsents: [
			{
				researchConsent: { type: Boolean },
				dateOfResearchConsent: { type: Date },
			},
		],
	})
);

module.exports = {
	up: async function up() {
		await connect();
		await ConsentModel.updateMany(
			{},
			{
				$unset: {
					'userConsent.researchConsent': '',
					'userConsent.dateOfResearchConsent': '',
					'parentConsents.0.researchConsent': '',
					'parentConsents.0.dateOfResearchConsent': '',
				},
			}
		)
			.lean()
			.exec();
		await close();
	},
	down: async function down() {
		return null;
	},
};
