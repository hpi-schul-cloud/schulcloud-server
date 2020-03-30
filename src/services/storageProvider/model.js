const mongoose = require('mongoose');

const { Schema } = mongoose;

const { enableAuditLog } = require('../../utils/database');

const storageProviderSchema = new Schema({
	type: { type: String, enum: ['S3'], required: true },
	isShared: { type: Boolean, default: false },
	accessKeyId: { type: String, required: true },
	secretAccessKey: { type: String, required: true },
	endpointUrl: { type: String, required: true },
	region: { type: String },
	maxBuckets: { type: Number, required: true },
	schools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'school', index: true }],
}, {
	timestamps: true,
});

enableAuditLog(storageProviderSchema);

const storageProviderModel = mongoose.model('storageprovider', storageProviderSchema);

module.exports = storageProviderModel;
