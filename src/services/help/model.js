const mongoose = require('mongoose');

const { Schema } = mongoose;

const helpDocumentsSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	theme: { type: String },
	data: [{
		title: { type: String, required: true },
		content: { type: String, required: true },
	}],
}, { timestamps: true });

const helpDocumentsModel = mongoose.model('helpdocument', helpDocumentsSchema);

module.exports = {
	helpDocumentsModel,
};
