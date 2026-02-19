const { promisify } = require('es6-promisify');
const { AesEncryptionHelper } = require('../../../../dist/apps/server/shared/common/utils/aes-encryption');
const { Configuration } = require('@hpi-schul-cloud/commons');
const aws = require('aws-sdk');
const mongoose = require('mongoose');
const { ENVIRONMENTS } = require('../../../../config/environments');
const { NotFound, BadRequest, GeneralError } = require('../../../errors');
const logger = require('../../../logger');
const { schoolModel } = require('../../school/model');
const { StorageProviderModel } = require('../../storageProvider/model');
const UserModel = require('../../user/model');
const { updateProviderForSchool, findProviderForSchool } = require('../utils/providerAssignmentHelper');

const HOST = Configuration.get('HOST');
const BUCKET_NAME_PREFIX = 'bucket-';

const getBoolean = (value) => value === true || value === 'true';

const getCorsRules = () => [
	{
		AllowedHeaders: ['*'],
		AllowedMethods: ['PUT'],
		AllowedOrigins: [HOST],
		MaxAgeSeconds: 300,
	},
];

const chooseProvider = async (schoolId) => {
	let providers = [];
	let provider;
	const session = await mongoose.startSession();
	await session.withTransaction(
		async () => {
			// We need to figure out if we run in a replicaset, because DB-calls with transaction
			// will fail if not run in a replicaset.
			const effectiveSession = session.clientOptions.replicaSet ? session : undefined;
			providers = await StorageProviderModel.find({ isShared: true })
				.sort({ freeBuckets: -1, _id: 1 })
				.limit(1)
				.session(effectiveSession)
				.lean()
				.exec();

			if (!Array.isArray(providers) || providers.length === 0) throw new Error('No available provider found.');
			provider = providers[0];

			await Promise.all([
				StorageProviderModel.findByIdAndUpdate(provider._id, { $inc: { freeBuckets: -1 } })
					.session(effectiveSession)
					.lean()
					.exec(),
				schoolModel
					.findByIdAndUpdate(schoolId, { $set: { storageProvider: provider._id } })
					.session(effectiveSession)
					.lean()
					.exec(),
			]);
		},
		{ readPreference: 'primary' } // transactions will only work with readPreference = 'primary'
	);
	session.endSession();

	return provider;
};

const getS3 = (storageProvider, awsClientHelper) => {
	const S3_KEY = Configuration.get('S3_KEY');
	storageProvider.secretAccessKey = AesEncryptionHelper.decrypt(storageProvider.secretAccessKey, S3_KEY);

	const config = new awsClientHelper.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: storageProvider.accessKeyId,
		secretAccessKey: storageProvider.secretAccessKey,
		region: storageProvider.region,
		endpointUrl: storageProvider.endpointUrl,
	});

	if (Configuration.get('FEATURE_S3_BUCKET_CORS') === true) {
		config.cors_rules = getCorsRules();
	}
	config.endpoint = new awsClientHelper.Endpoint(storageProvider.endpointUrl);

	return new awsClientHelper.S3(config);
};

const listBuckets = async (awsObject) => {
	try {
		const response = await awsObject.s3.listBuckets().promise();
		return response.Buckets ? response.Buckets.map((b) => b.Name) : [];
	} catch (e) {
		logger.warning('Could not retrieve buckets for provider', e);

		return [];
	}
};

const getBucketName = (schoolId) => `${BUCKET_NAME_PREFIX}${schoolId}`;

/**
 * If school was not found by its provider try to find the school bucket by other providers
 * - Get all storage providers from the database
 * - Get all buckets from the storage providers
 * - Try to find the school bucket by other providers
 * - If school bucket was found by another provider - update the school provider
 * @param awsObject - {s3, bucket}
 * @returns {Promise<{s3: *, bucket: string}|{s3: *, bucket: string}|*>}
 */
const reassignProviderForSchool = async (awsObject, awsClientHelper) => {
	const schoolId = awsObject.bucket.replace(BUCKET_NAME_PREFIX, '');
	const storageProviders = await StorageProviderModel.find().lean().exec();
	const bucketsForProvider = {};

	for (const provider of storageProviders) {
		const config = getS3(provider, awsClientHelper);
		const awsObj = { s3: config };
		// eslint-disable-next-line no-await-in-loop
		bucketsForProvider[provider._id] = await listBuckets(awsObj);
	}

	const correctProvider = findProviderForSchool(bucketsForProvider, schoolId);

	if (correctProvider !== undefined) {
		logger.error(`Correct provider for school ${schoolId} could be found ${correctProvider}`);
		await updateProviderForSchool(correctProvider, schoolId);
		const err = new GeneralError('Upload failed. Please refresh the page and try again.');
		err.provider = correctProvider;

		throw err;
	}

	return awsObject;
};

const putBucketCors = async (awsObject) =>
	awsObject.s3
		.putBucketCors({
			Bucket: awsObject.bucket,
			CORSConfiguration: {
				CORSRules: getCorsRules(),
			},
		})
		.promise();

/**
 * Creates bucket. If s3 create bucket returns 409 (Conflict)
 * - it means that the bucket already exists by another provider
 * - try to find the bucket and reassign it to the correct provider
 * @param awsObject - {s3, bucket}
 * @returns {Promise<{code: number, data: *, message: string}>}
 */
const createBucket = async (awsObject, awsClientHelper) => {
	try {
		logger.info(`Bucket ${awsObject.bucket} does not exist - creating ... `);
		await awsObject.s3.createBucket({ Bucket: awsObject.bucket }).promise();
		if (Configuration.get('FEATURE_S3_BUCKET_CORS') === true) {
			await putBucketCors(awsObject);
		}

		return awsObject;
	} catch (err) {
		logger.error(`Error by creating the bucket ${awsObject.bucket}: ${err.code} ${err.message}`);
		if (err.statusCode === 409 || err.statusCode === 403) {
			logger.error(`Bucket ${awsObject.bucket} does not exist. 
							Probably it already exists by another provider. Trying to find by other providers. 
							${err.code} - ${err.message}`);
			return reassignProviderForSchool(awsObject, awsClientHelper);
		}
		throw err;
	}
};

const loadDevelopmentAwsConfig = () => {
	const HOST = Configuration.get('HOST');
	const AWS_ACCESS_KEY = Configuration.get('AWS_ACCESS_KEY');
	const AWS_SECRET_ACCESS_KEY = Configuration.get('AWS_SECRET_ACCESS_KEY');
	const AWS_REGION = Configuration.get('AWS_REGION');
	const AWS_ENDPOINT_URL = Configuration.get('AWS_ENDPOINT_URL');

	const awsConfig = {
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
		region: AWS_REGION,
		endpointUrl: AWS_ENDPOINT_URL,
		cors_rules: [
			{
				AllowedHeaders: ['*'],
				AllowedMethods: ['PUT'],
				AllowedOrigins: [HOST],
				MaxAgeSeconds: 300,
			},
		],
	};

	return awsConfig;
};

class AWSS3Strategy {
	constructor(awsClientHelper, config) {
		this.awsClientHelper = awsClientHelper || aws;
		this.awsConfig = config || this.loadConfigFromDisk();
	}

	loadConfigFromDisk() {
		let awsConfig = {}; // TODO: Need cleanup to make it testable
		if (Configuration.get('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED') === false) {
			try {
				/* eslint-disable global-require, no-unused-expressions */
				Configuration.get('NODE_ENV') === ENVIRONMENTS.PRODUCTION
					? (awsConfig = loadDevelopmentAwsConfig())
					: (awsConfig = require('../../../../config/secrets.json').aws);
			} catch (e) {
				logger.warning("The AWS config couldn't be read");
			}
		}

		return awsConfig;
	}

	connect(storageProvider) {
		return getS3(storageProvider, this.awsClientHelper);
	}

	checkSchool(school) {
		if (school === null) throw new NotFound('School not found.');
	}

	async loadSchool(schoolId) {
		const school = await schoolModel
			.findOne({ _id: schoolId }, null, { readPreference: 'primary' }) // primary for afterhook in school.create
			.populate('storageProvider')
			.select(['storageProvider'])
			.lean()
			.exec();

		this.checkSchool(school);

		return school;
	}

	checkUser(user) {
		if (!user) {
			throw new NotFound('User not found');
		}
	}

	async loadUser(userId) {
		const user = UserModel.userModel.findById(userId).lean().exec();

		this.checkUser(user);

		return user;
	}

	async createAWSObjectFromSchool(school) {
		const schoolId = school._id.toString();
		let awsObject;
		if (Configuration.get('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED') === true) {
			if (!school.storageProvider) {
				school.storageProvider = await chooseProvider(schoolId);
			}
			const s3 = getS3(school.storageProvider, this.awsClientHelper);

			awsObject = {
				s3,
				bucket: getBucketName(schoolId),
			};
		} else {
			if (!this.awsConfig.endpointUrl) {
				throw new Error('S3 integration is not configured on the server');
			}

			const config = new this.awsClientHelper.Config(this.awsConfig);
			config.endpoint = new this.awsClientHelper.Endpoint(this.awsConfig.endpointUrl);

			awsObject = {
				s3: new this.awsClientHelper.S3(config),
				bucket: getBucketName(schoolId),
			};
		}

		return awsObject;
	}

	checkCreateParams(schoolId) {
		if (!schoolId) {
			throw new BadRequest('No school id parameter given.');
		}
	}

	async create(schoolId) {
		this.checkCreateParams(schoolId);
		const school = await this.loadSchool(schoolId);
		const awsObject = await this.createAWSObjectFromSchool(school);
		const data = await createBucket(awsObject, this.awsClientHelper);

		return {
			message: 'Successfully created s3-bucket!',
			data,
			code: 200,
		};
	}

	getBucket(schoolId) {
		return getBucketName(schoolId);
	}

	async listBucketsNames(awsObject) {
		return listBuckets(awsObject);
	}

	async createIfNotExists(awsObject) {
		const params = {
			Bucket: awsObject.bucket,
		};

		try {
			await awsObject.s3.headBucket(params).promise();
			logger.info(`Bucket ${awsObject.bucket} does exist`);
			return awsObject;
		} catch (err) {
			if (err.statusCode === 404 || err.statusCode === 403) {
				const response = await createBucket(awsObject, this.awsClientHelper);
				logger.info(`Bucket ${response.bucket} created ... `);

				return response;
			}
			throw err;
		}
	}

	checkDeleteFileParams(userId, filename) {
		if (!userId || !filename) {
			throw new BadRequest('Missing parameters by deleteFile.', { userId, filename });
		}
	}

	async deleteFile(userId, filename) {
		this.checkDeleteFileParams(userId, filename);
		const user = await this.loadUser(userId);
		const school = await this.loadSchool(user.schoolId);
		const awsObject = await this.createAWSObjectFromSchool(school);

		const params = {
			Bucket: awsObject.bucket,
			Delete: {
				Objects: [
					{
						Key: filename,
					},
				],
				Quiet: true,
			},
		};

		return promisify(awsObject.s3.deleteObjects.bind(awsObject.s3), awsObject.s3)(params);
	}

	checkGenerateSignedUrl(userId, flatFileName, fileType) {
		if (!userId || !flatFileName || !fileType) {
			throw new BadRequest('Missing parameters by generateSignedUrl.', { userId, flatFileName, fileType });
		}
	}

	async generateSignedUrl({ userId, flatFileName, fileType, header }) {
		this.checkGenerateSignedUrl(userId, flatFileName, fileType);
		const user = await this.loadUser(userId);
		const school = await this.loadSchool(user.schoolId);
		const awsObject = await this.createAWSObjectFromSchool(school);
		const safeAwsObject = await this.createIfNotExists(awsObject);

		const params = {
			Bucket: safeAwsObject.bucket,
			Key: flatFileName,
			Expires: Configuration.get('STORAGE_SIGNED_URL_EXPIRE'),
			ContentType: fileType,
			Metadata: header,
		};

		return promisify(safeAwsObject.s3.getSignedUrl.bind(safeAwsObject.s3), safeAwsObject.s3)('putObject', params);
	}

	checkSignedUrlParameter(storageProviderId, bucket, flatFileName) {
		if (!storageProviderId || !bucket || !flatFileName) {
			throw new BadRequest('Missing parameters by getSignedUrl.', { storageProviderId, bucket, flatFileName });
		}
	}

	// private
	async getAwsObjectForMultipleProvider(bucket, storageProviderId) {
		const storageProvider = await StorageProviderModel.findOne({ _id: storageProviderId }).lean().exec();

		if (!storageProvider) {
			throw new NotFound('Storage provider not found.');
		}

		const s3 = getS3(storageProvider, this.awsClientHelper);
		const awsObject = {
			s3,
			bucket,
		};

		return awsObject;
	}

	// private
	async getAwsObjectForSingleProviderFromDiskConfig(bucket, awsClientHelper, awsConfig) {
		if (!awsConfig.endpointUrl) {
			throw new Error('S3 integration is not configured on the server');
		}

		const config = new this.awsClientHelper.Config(awsConfig);
		config.endpoint = new this.awsClientHelper.Endpoint(awsConfig.endpointUrl);

		const awsObject = {
			s3: new awsClientHelper.S3(config),
			bucket,
		};

		return awsObject;
	}

	async getSignedUrl({ storageProviderId, bucket, flatFileName, localFileName, download, action = 'getObject' }) {
		this.checkSignedUrlParameter(storageProviderId, bucket, flatFileName);

		let awsObject;
		if (Configuration.get('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED') === true) {
			awsObject = await this.getAwsObjectForMultipleProvider(bucket, storageProviderId);
		} else {
			awsObject = this.getAwsObjectForSingleProviderFromDiskConfig(bucket, this.awsClientHelper, this.awsConfig);
		}

		const params = {
			Bucket: bucket,
			Key: flatFileName,
			Expires: Configuration.get('STORAGE_SIGNED_URL_EXPIRE'),
		};

		if (getBoolean(download)) {
			params.ResponseContentDisposition = `attachment; filename = "${localFileName.replace(/"/g, '')}"`;
		}

		return promisify(awsObject.s3.getSignedUrl.bind(awsObject.s3), awsObject.s3)(action, params);
	}
}

module.exports = AWSS3Strategy;
