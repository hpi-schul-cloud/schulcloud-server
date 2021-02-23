const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const consentForm = ['analog', 'digital', 'update'];
const User = mongoose.model(
	'userNew',
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

const oldUser = mongoose.model(
	'userOld',
	new mongoose.Schema(
		{
			consent: new mongoose.Schema({
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
			}),
		},
		{
			timestamps: true,
		}
	),
	'users'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();

		const amount = await oldUser.find({ consent: { $ne: null } }).countDocuments();
		info(`${amount} user.consent.id's will be removed`);
		const limit = 500;
		let skip = 0;
		let looped = 0;

		while (looped < amount) {
			const users = await oldUser
				.find({ consent: { $ne: null } })
				.sort({
					updatedAt: 1,
					createdAt: 1,
				})
				.skip(skip)
				.limit(limit)
				.lean()
				.exec();
			info("remove user.consent.id's");
			try {
				await Promise.all(
					users.map(async (user) => {
						if (!user.consent) {
							return Promise.resolve();
						}
						const consent = { ...user.consent };
						delete consent._id;
						return User.findByIdAndUpdate(user._id, { $set: { consent } }).exec();
					})
				);
				info(`${looped + users.length} user.consent.id's are removed`);
			} catch (err) {
				error(
					`Removing user.consent.id's between ${skip * limit} and ${skip * limit + limit} failed,
but will go on with next loop: ${err.message}\n ${err}`
				);
			}
			looped += users.length;
			skip = looped;
		}
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();

		const amount = await User.find({ consent: { $ne: null } }).countDocuments();
		info(`${amount} user.consent.id's will be inserted`);
		const limit = 500;
		let skip = 0;
		let looped = 0;

		while (looped < amount) {
			const users = await User.find({ consent: { $ne: null } })
				.sort({
					updatedAt: 1,
					createdAt: 1,
				})
				.skip(skip)
				.limit(limit)
				.lean()
				.exec();
			try {
				await Promise.all(
					users.map(async (user) => {
						if (!user.consent) {
							return Promise.resolve();
						}
						const consent = { ...user.consent };
						return oldUser.findByIdAndUpdate(user._id, { $set: { consent } }).exec();
					})
				);
				info(`${looped + users.length} user.consent.id's are inserted`);
			} catch (err) {
				error(
					`Inserting user.consent.id's between ${skip * limit} and ${skip * limit + limit} failed,
but will go on with next loop: ${err.message}\n ${err}`
				);
			}
			looped += users.length;
			skip = looped;
		}
		// ////////////////////////////////////////////////////
		await close();
	},
};
