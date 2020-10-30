const mongoose = require('mongoose');

const { Schema } = mongoose;

const trashbinSchema = {
	userId: { type: Schema.Types.ObjectId },
	document: { type: String },
	deletedAt: { type: Date, default: null },
};

const trashbinModel = mongoose.model('trashbin', trashbinSchema);

module.exports = trashbinModel;
