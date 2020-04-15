const mongoose = require('mongoose');

const { Schema } = mongoose;
const idValidator = require('mongoose-id-validator');
const uuid = require('uuid/v4');
const { enableAuditLog } = require('../../utils/database');

const pseudonymSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'user' },
	toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
	pseudonym: { type: String, required: true, default: uuid },
}, {
	timestamps: true,
});

const modelName = 'Pseudonym';

pseudonymSchema.plugin(idValidator);
enableAuditLog(pseudonymSchema, { modelName });

const pseudonymModel = mongoose.model(modelName, pseudonymSchema);

module.exports = pseudonymModel;
