const mongoose = require('mongoose');

const { Schema } = mongoose;

const webuntisMetadataSchema = new Schema(
	{
		datasourceId: { type: Schema.Types.ObjectId, ref: 'datasource' },
		teacher: { type: String },
		class: { type: String },
		subject: { type: String },
		room: { type: String },
		state: { type: String, enum: ['new', 'imported', 'discarded'] },
	},
	{ timestamps: true }
);

const webuntisMetadataModel = mongoose.model('webuntismetadata', webuntisMetadataSchema);

module.exports = { webuntisMetadataModel };
