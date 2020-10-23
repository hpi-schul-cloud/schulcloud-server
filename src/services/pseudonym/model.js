const mongoose = require('mongoose');

const { Schema } = mongoose;
const idValidator = require('mongoose-id-validator');
const { v4: uuidv4 } = require('uuid');
const { enableAuditLog } = require('../../utils/database');

const pseudonymSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user' },
		toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
		pseudonym: { type: String, required: true, default: uuidv4 },
	},
	{
		timestamps: true,
	}
);

pseudonymSchema.plugin(idValidator);
enableAuditLog(pseudonymSchema);

const pseudonymModel = mongoose.model('Pseudonym', pseudonymSchema);

module.exports = pseudonymModel;
