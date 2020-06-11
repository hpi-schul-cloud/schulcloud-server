// helpdesk-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const states = ['open', 'closed', 'submitted'];

const problemSchema = new Schema({
	subject: { type: String, required: true },
	currentState: { type: String },
	targetState: { type: String },
	state: { type: String, enum: states, default: 'open' },
	notes: { type: String },
	order: { type: Number, default: 0 },
	userId: { type: Schema.Types.ObjectId, ref: 'user' },
	schoolId: { type: Schema.Types.ObjectId, ref: 'school', required: true },
	forwardedAt: { type: Date },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

enableAuditLog(problemSchema);

const problemModel = mongoose.model('problem', problemSchema);

module.exports = problemModel;
