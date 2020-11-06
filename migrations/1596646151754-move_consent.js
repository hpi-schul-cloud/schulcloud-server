const mongoose = require('mongoose');
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const consentForm = ['analog', 'digital', 'update'];
const Consent = mongoose.model(
	'oldConsentModel_20200805',
	new mongoose.Schema(
		{
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
			parentConsents: [
				{
					parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
					form: { type: String, enum: consentForm },
					dateOfPrivacyConsent: { type: Date },
					dateOfTermsOfUseConsent: { type: Date },
					privacyConsent: { type: Boolean },
					termsOfUseConsent: { type: Boolean },
				},
			],
		},
		{
			timestamps: true,
		}
	),
	'consents'
);

const User = mongoose.model(
	'newUserConsent_20200805',
	new mongoose.Schema(
		{
			consent: {
				userConsent: {
					form: { type: String, enum: consentForm },
					dateOfPrivacyConsent: { type: Date },
					dateOfTermsOfUseConsent: { type: Date },
					privacyConsent: { type: Boolean },
					termsOfUseConsent: { type: Boolean },
				},
				parentConsents: [
					{
						parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
						form: { type: String, enum: consentForm },
						dateOfPrivacyConsent: { type: Date },
						dateOfTermsOfUseConsent: { type: Date },
						privacyConsent: { type: Boolean },
						termsOfUseConsent: { type: Boolean },
					},
				],
			},
		},
		{
			timestamps: true,
		}
	),
	'users'
);

module.exports = {
	up: async function up() {
		await connect();

		const amount = await Consent.countDocuments();
		info(`${amount} consent will be moved`);
		const limit = 500;
		let skip = 0;
		let looped = 0;

		while (looped < amount) {
			// ////////////////////////////////////////////////////
			// Make changes to the database here.
			// Hint: Access models via this('modelName'), not an imported model to have
			// access to the correct database connection. Otherwise Mongoose calls never return.
			info('load current amount consents');
			const consents = await Consent.find()
				.sort({
					updatedAt: 1,
					createdAt: 1,
				})
				.skip(skip)
				.limit(limit)
				.lean()
				.exec();
			looped += consents.length;
			skip = looped;
			info('move consents to the coresponding user');
			try {
				await Promise.all(
					consents.map(async (consent) => {
						const { userId, ...consentWithoutUser } = consent;
						return User.findOneAndUpdate(
							{
								_id: userId,
							},
							{
								consent: consentWithoutUser,
							}
						).exec();
					})
				);
				info(`${looped} Consents are moved from consent to user`);
			} catch (err) {
				error(`Moving Consents
					between ${skip * limit}
					and ${skip * limit + limit}
					failed but will go on
					with next loop: ${err.message}`);
			}
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
			await Promise.all(
				users.map((user) =>
					Consent.findOneAndUpdate(
						{
							userId: user._id,
						},
						{
							...user.consent,
						}
					).exec()
				)
			);
			info('Consent are moved from user to consent model');
		} catch (err) {
			error(`Moving one or more Consents failed: ${err.message}`);
		}
		// ////////////////////////////////////////////////////
		await close();
	},
};
