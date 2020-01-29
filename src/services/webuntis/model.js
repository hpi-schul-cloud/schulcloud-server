const mongoose = require('mongoose');

const { Schema } = mongoose;

const webuntisMetadataSchema = new Schema({
	datasourceRunId: { type: Schema.Types.ObjectId, ref: 'datasourceRun' },
	teacher: { type: String },
	class: { type: String },
	subject: { type: String },
	room: { type: String },
}, { timestamps: true });

const webuntisMetadataModel = mongoose.model('webuntiscoursemetadata', webuntisMetadataSchema);

module.exports = { webuntisMetadataModel };
