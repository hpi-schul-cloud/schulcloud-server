const mongoose = require('mongoose');

const { Schema } = mongoose;

const timeSchema = new Schema({
	weekday: {
		type: Number, min: 0, max: 6, required: true,
	},
	startTime: { type: Number },
	duration: { type: Number },
	room: { type: String },
});

const webuntisMetadataSchema = new Schema({
	datasourceId: { type: Schema.Types.ObjectId, ref: 'datasource' },
	teacher: { type: String },
	class: { type: String },
	subject: { type: String },
	times: [timeSchema],
	state: { type: String, enum: ['new', 'imported', 'discarded', 'errored'] },
}, { timestamps: true });

const webuntisMetadataModel = mongoose.model('webuntismetadata', webuntisMetadataSchema);

module.exports = { webuntisMetadataModel };
