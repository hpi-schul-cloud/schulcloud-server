const mongoose = require('mongoose');

const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const helpDocumentsSchema = new Schema(
	{
		schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
		theme: { type: String },
		schoolGroupId: { type: Schema.Types.ObjectId, ref: 'schoolGroup' },
		data: [
			{
				title: { type: String, required: true },
				content: { type: String, required: true },
			},
		],
	},
	{ timestamps: true }
);

enableAuditLog(helpDocumentsSchema);

const helpDocumentsModel = mongoose.model('helpdocument', helpDocumentsSchema);

module.exports = {
	helpDocumentsModel,
};
