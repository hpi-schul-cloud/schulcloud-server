const mongoose = require('mongoose');

const { Schema } = mongoose;

const base64FileSchema = new Schema({
	data: { type: String, require: true },
	schoolId: { type: Schema.Types.ObjectId, index: true }, // schoolId should not required!
	fileType: { type: String }, // TODO: Enum ? List of valid types?
}, { timestamps: true });

const base64FileModel = mongoose.model('base64File', base64FileSchema);

module.exports = {
	base64FileSchema,
	base64FileModel,
};
