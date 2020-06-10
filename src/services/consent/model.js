// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const mongooseHistory = require('mongoose-history');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const consentForm = ['analog', 'digital', 'update'];
const consentSource = ['automatic-consent', 'tsp-sync'];

const consentSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'user',
		required: true,
		index: true,
	},
	userConsent: {
		form: { type: String, enum: consentForm },
		source: { type: String, enum: consentSource },
		dateOfPrivacyConsent: { type: Date },
		dateOfTermsOfUseConsent: { type: Date },
		privacyConsent: { type: Boolean },
		termsOfUseConsent: { type: Boolean },
	},
	parentConsents: [{
		parentId: { type: Schema.Types.ObjectId, ref: 'user' },
		form: { type: String, enum: consentForm },
		source: { type: String, enum: consentSource },
		dateOfPrivacyConsent: { type: Date },
		dateOfTermsOfUseConsent: { type: Date },
		privacyConsent: { type: Boolean },
		termsOfUseConsent: { type: Boolean },
	}],
});

enableAuditLog(consentSchema);
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
	// create request that include consentData, create a new base64Files entries and pass the id to consentDataId
	consentDataId: { type: Schema.Types.ObjectId, ref: 'base64Files' },
	schoolId: { type: Schema.Types.ObjectId },
	publishedAt: { type: Date, required: true },
	title: { type: String, required: true },
}, { timestamps: true });

const consentModel = mongoose.model('consent', consentSchema);
const ConsentVersionModel = mongoose.model('consentVersion', consentVersionSchema);

module.exports = {
	consentModel,
	consentTypes,
	ConsentVersionModel,
};
