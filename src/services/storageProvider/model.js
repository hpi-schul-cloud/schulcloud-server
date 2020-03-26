const mongoose = require('mongoose');

const { Schema } = mongoose;

const { enableAuditLog } = require('../../utils/database');

const storageProviderSchema = new Schema({
	type: { type: String, enum: ['awsS3'], required: true },
	isShared: { type: Boolean },
	accessKeyId: { type: String, required: true },
	secretAccessKey: { type: String, required: true },
	endpointUrl: { type: String, required: true },
	region: { type: String },
	maxBuckets: { type: Number, required: true },
	schools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'school' }],
}, {
	timestamps: true,
});

enableAuditLog(storageProviderSchema);

const storageProviderModel = mongoose.model('StorageProvider', storageProviderSchema);

module.exports = storageProviderModel;
