const mongoose = require('mongoose');

const { Schema } = mongoose;

const { enableAuditLog } = require('../../utils/database');

const storageProviderSchema = new Schema({
	type: { type: String, enum: ['awsS3'], required: true },
	isShared: { type: Boolean },
	accessKeyId: { type: String, required: true },
	endpointUrl: { type: String, required: true },
	region: { type: String },
}, {
	timestamps: true,
});

enableAuditLog(storageProviderSchema);

const storageProviderModel = mongoose.model('StorageProvider', storageProviderSchema);

module.exports = storageProviderModel;
