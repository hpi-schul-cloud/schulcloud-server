'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const consentForm = ['analog', 'digital'];

const consentSchema = new Schema({
	userId: {type: Schema.Types.ObjectId, ref: 'user', required: true, index: true},
	userConsent: {
		form: {type: String, enum: consentForm},
		dateOfPrivacyConsent: {type: Date},
		dateOfTermsOfUseConsent: {type: Date},
		dateOfThirdPartyConsent: {type: Date},
		dateOfResearchConsent: {type: Date},
		privacyConsent: {type: Boolean},
		termsOfUseConsent: {type: Boolean},
		thirdPartyConsent: {type: Boolean},
		researchConsent: {type: Boolean}
	},
	parentConsents: [{
		parentId: {type: Schema.Types.ObjectId, ref: 'user'},
		form: {type: String, enum: consentForm},
		dateOfPrivacyConsent: {type: Date},
		dateOfTermsOfUseConsent: {type: Date},
		dateOfThirdPartyConsent: {type: Date},
		dateOfResearchConsent: {type: Date},
		privacyConsent: {type: Boolean},
		termsOfUseConsent: {type: Boolean},
		thirdPartyConsent: {type: Boolean},
		researchConsent: {type: Boolean},
	}]
});

const consentVersionSchema = new Schema({
	versionNumber: {type: String},
	consentText: {type: String},
	date: {type: Date}
});

const consentModel = mongoose.model('consent', consentSchema);
const consentVersionModel = mongoose.model('consentVersion', consentVersionSchema);

module.exports = {
	consentModel,
	consentVersionModel
};
