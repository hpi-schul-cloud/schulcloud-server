const mongoose = require('mongoose');

const { Schema } = mongoose;

const { enableAuditLog } = require('../../utils/database');

const storageProviderSchema = new Schema(
	{
		type: { type: String, enum: ['S3'], required: true },
		isShared: { type: Boolean, default: false },
		accessKeyId: { type: String, required: true },
		secretAccessKey: { type: String, required: true },
		endpointUrl: { type: String, required: true },
		region: { type: String, default: 'eu-de' },
		maxBuckets: { type: Number, required: true },
		freeBuckets: { type: Number, required: true, index: true },
	},
	{
		timestamps: true,
	}
);

enableAuditLog(storageProviderSchema);

const StorageProviderModel = mongoose.model('storageprovider', storageProviderSchema);

module.exports = { StorageProviderModel, storageProviderSchema };
