const mongoose = require('mongoose');

const { Schema } = mongoose;
const idValidator = require('mongoose-id-validator');
const uuid = require('uuid/v4');
const { enableAuditLog } = require('../../utils/database');

const Pseudonym = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'user' },
	toolId: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
	pseudonym: { type: String, required: true, default: uuid },
}, {
	timestamps: true,
});

Pseudonym.plugin(idValidator);
enableAuditLog(Pseudonym);

module.exports = mongoose.model('Pseudonym', Pseudonym);
