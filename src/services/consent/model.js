// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const mongooseHistory = require('mongoose-history');

const { Schema } = mongoose;

const consentForm = ['analog', 'digital'];

const consentSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
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
		parentId: { type: Schema.Types.ObjectId, ref: 'user' },
		form: { type: String, enum: consentForm },
		dateOfPrivacyConsent: { type: Date },
		dateOfTermsOfUseConsent: { type: Date },
		privacyConsent: { type: Boolean },
		termsOfUseConsent: { type: Boolean },
	}],
});

consentSchema.plugin(mongooseHistory);

const consentTypes = {
	PRIVACY: 'privacy',
	TERMS_OF_USE: 'termsOfUse',
};

const consentVersionSchema = new Schema({
	consentTypes: [{
		type: String,
		required: true,
		enum: Object.values(consentTypes),
	}],
	consentText: { type: String, required: true },
	publishedAt: { type: Date, required: true },
	title: { type: String, required: true },
}, { timestamps: true });

consentVersionSchema.plugin(mongooseHistory);

const consentModel = mongoose.model('consent', consentSchema);
const ConsentVersionModel = mongoose.model('consentVersion', consentVersionSchema);

module.exports = {
	consentModel,
	consentTypes,
	ConsentVersionModel,
};
