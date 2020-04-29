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
		const consents = await Consent.find({
			$sort: {
				updatedAt: 1,
				createdAt: 1,
			},
		}).lean().exec();
		info('move each consent to the coresponding user');
		try {
			await Promise.all(consents.map(async (consent) => {
				const { userId, ...consentWithoutUser } = consent;
				return User.findOneAndUpdate({
					_id: userId,
				}, {
					consent: consentWithoutUser,
				}).exec();
			}));
			info('Consents are moved from consent to user');
		} catch (err) {
			error(`Moving one or more Consents failed: ${err.message}`);
		}

		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		info('load all users');
		const users = await User.find({}).lean().exec();
		info('update or create consent');
		try {
			await Promise.all(users.map((user) => Consent.findOneAndUpdate({
				userId: user._id,
			}, {
				...user.consent,
			}).exec()));
			info('Consent are moved from user to consent model');
		} catch (err) {
			error(`Moving one or more Consents failed: ${err.message}`);
		}
		// ////////////////////////////////////////////////////
		await close();
	},
};
