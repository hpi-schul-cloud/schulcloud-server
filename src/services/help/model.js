const mongoose = require('mongoose');

const { Schema } = mongoose;

const helpDocumentsSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	themeName: { type: String },
	data: [{
		title: { type: String, required: true },
		content: { type: String, required: true },
	}],
});

const helpDocumentsModel = mongoose.model('helpdocument', helpDocumentsSchema);

module.exports = {
	helpDocumentsModel,
};
