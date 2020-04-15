const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const consentForm = ['analog', 'digital', 'update'];
const Consent = mongoose.model('oldConsentModel_20200422', new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
		required: true,
		index: true,
	},
	userConsent: {
		form: { type: String, enum: consentForm },
		dateOfPrivacyConsent: { type: Date },
		dateOfTermsOfUseConsent: { type: Date },
		privacyConsent: { type: Boolean },
		termsOfUseConsent: { type: Boolean },
	},
	parentConsents: [{
		parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
		form: { type: String, enum: consentForm },
		dateOfPrivacyConsent: { type: Date },
		dateOfTermsOfUseConsent: { type: Date },
		privacyConsent: { type: Boolean },
		termsOfUseConsent: { type: Boolean },
	}],
}, {
	timestamps: true,
}), 'consents');


const User = mongoose.model('newUserConsent_20200422', new mongoose.Schema({
	consent: {
		userConsent: {
			form: { type: String, enum: consentForm },
			dateOfPrivacyConsent: { type: Date },
			dateOfTermsOfUseConsent: { type: Date },
			privacyConsent: { type: Boolean },
			termsOfUseConsent: { type: Boolean },
		},
		parentConsents: [{
			parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
			form: { type: String, enum: consentForm },
			dateOfPrivacyConsent: { type: Date },
			dateOfTermsOfUseConsent: { type: Date },
			privacyConsent: { type: Boolean },
			termsOfUseConsent: { type: Boolean },
		}],
	},
}, {
	timestamps: true,
}), 'users');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb


// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line


/** ***
 *
 *
 * 	TODO: handle multiple records for a user in consents collection
 *
 */


module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		info('load current consents');
		const consents = await Consent.find({}).lean();
		console.log(consents);
		info('move each consent to the coresponding user');
		await Promise.all(consents.map(async (consent) => {
			const { userId, ...consentWithoutUser } = consent;
			/* console.log(User.findOne({
				_id: userId,
			}).lean().exec()); */
			return User.findOneAndUpdate({
				_id: userId,
			}, {
				consent: consentWithoutUser,
			}).exec();
		}));
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		/* await User.findOneAndUpdate({
			firstName: 'Max',
			lastName: 'Mathe',
		}, {
			firstName: 'Marla',
		}).lean().exec(); */
		// ////////////////////////////////////////////////////
		await close();
	},
};
