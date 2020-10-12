// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const mongooseHistory = require('mongoose-history');
const { enableAuditLog } = require('../../../utils/database');

const { Schema } = mongoose;

const consentForm = ['analog', 'digital', 'update'];
const consentSource = ['automatic-consent', 'tsp-sync'];

const consentSchema = {
	userConsent: {
		form: { type: String, enum: consentForm },
		source: { type: String, enum: consentSource },
		dateOfPrivacyConsent: { type: Date },
		dateOfTermsOfUseConsent: { type: Date },
		privacyConsent: { type: Boolean },
		termsOfUseConsent: { type: Boolean },
	},
	parentConsents: [
		{
			parentId: { type: Schema.Types.ObjectId, ref: 'user' },
			form: { type: String, enum: consentForm },
			source: { type: String, enum: consentSource },
			dateOfPrivacyConsent: { type: Date },
			dateOfTermsOfUseConsent: { type: Date },
			privacyConsent: { type: Boolean },
			termsOfUseConsent: { type: Boolean },
		},
	],
};

const consentTypes = {
	PRIVACY: 'privacy',
	TERMS_OF_USE: 'termsOfUse',
};

module.exports = {
	consentSchema,
	consentTypes,
};
