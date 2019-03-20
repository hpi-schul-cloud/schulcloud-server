// release-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const clipboardSchema = new Schema({
	course: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
	state: {
		board: {
			type: mongoose.Schema.Types.Mixed,
		},
		desks: {
			type: mongoose.Schema.Types.Mixed,
		},
		lastId: Number,
	},
	version: { type: Number, required: true },
	createdAt: { type: Date, default: Date.now },
}, { minimize: false });

const clipboardModel = mongoose.model('clipboards', clipboardSchema);
module.exports = clipboardModel;
