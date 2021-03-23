// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { consentTypes } = require('../../components/user/repo/db/user.schema');

const { Schema } = mongoose;

const consentVersionSchema = new Schema(
	{
		consentTypes: [
			{
				type: String,
				required: true,
				enum: Object.values(consentTypes),
				index: true,
			},
		],
		consentText: { type: String, required: true },
		// create request that include consentData, create a new base64Files entries and pass the id to consentDataId
		consentDataId: { type: Schema.Types.ObjectId, ref: 'base64Files' },
		schoolId: { type: Schema.Types.ObjectId, index: true },
		publishedAt: { type: Date, required: true, index: true },
		title: { type: String, required: true },
	},
	{ timestamps: true }
);

// const consentModel = mongoose.model('consent', consentSchema);
const ConsentVersionModel = mongoose.model('consentVersion', consentVersionSchema);

module.exports = {
	consentTypes,
	ConsentVersionModel,
};
