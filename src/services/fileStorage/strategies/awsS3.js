const { promisify } = require('es6-promisify');
const CryptoJS = require('crypto-js');
const { Configuration } = require('@hpi-schul-cloud/commons');
const aws = require('aws-sdk');
const mongoose = require('mongoose');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');
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

// begin legacy
let awsConfig = {}; // TODO: Need cleanup to make it testable
if (Configuration.get('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED') === false) {
	try {
		//	awsConfig = require(`../../../../config/secrets.${prodMode ? 'js' : 'json'}`).aws;
		/* eslint-disable global-require, no-unused-expressions */
		NODE_ENV === ENVIRONMENTS.PRODUCTION
			? (awsConfig = require('../../../../config/secrets.js').aws)
			: (awsConfig = require('../../../../config/secrets.json').aws);
		/* eslint-enable global-require, no-unused-expressions */
	} catch (e) {
		logger.warning("The AWS config couldn't be read");
	}
}
// end legacy

const getS3 = (storageProvider, awsClientHelper) => {
	const S3_KEY = Configuration.get('S3_KEY');
	storageProvider.secretAccessKey = CryptoJS.AES.decrypt(storageProvider.secretAccessKey, S3_KEY).toString(
		CryptoJS.enc.Utf8
	);

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

const createAWSObjectFromSchoolId = async (schoolId, awsClientHelper) => {
	const school = await schoolModel
		.findOne({ _id: schoolId }, null, { readPreference: 'primary' }) // primary for afterhook in school.create
		.populate('storageProvider')
		.select(['storageProvider'])
		.lean()
		.exec();

	if (school === null) throw new NotFound('School not found.');

	if (Configuration.get('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED') === true) {
		if (!school.storageProvider) {
			school.storageProvider = await chooseProvider(schoolId);
		}
		const s3 = getS3(school.storageProvider, awsClientHelper);

		return {
			s3,
			bucket: getBucketName(schoolId),
		};
	}

	// begin legacy
	if (!awsConfig.endpointUrl) throw new Error('S3 integration is not configured on the server');
	const config = new awsClientHelper.Config(awsConfig);
	config.endpoint = new awsClientHelper.Endpoint(awsConfig.endpointUrl);

	return {
		s3: new awsClientHelper.S3(config),
		bucket: getBucketName(schoolId),
	};
	// end legacy
};

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

class AWSS3Strategy {
	connect(storageProvider) {
		return getS3(storageProvider, aws);
	}

	async create(schoolId) {
		if (!schoolId) {
			throw new BadRequest('No school id parameter given.');
		}

		const awsObject = await createAWSObjectFromSchoolId(schoolId, aws);
		const data = await createBucket(awsObject, aws);

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
				const response = await createBucket(awsObject, aws);
				logger.info(`Bucket ${response.bucket} created ... `);

				return response;
			}
			throw err;
		}
	}

	copyFile(userId, oldPath, newPath, externalSchoolId) {
		if (!userId || !oldPath || !newPath) {
			return Promise.reject(new BadRequest('Missing parameters by copyFile.', { userId, oldPath, newPath }));
		}
		return UserModel.userModel
			.findById(userId)
			.lean()
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}

				return createAWSObjectFromSchoolId(result.schoolId, aws).then((awsObject) => {
					// files can be copied to different schools
					const sourceBucket = `bucket-${externalSchoolId || result.schoolId}`;

					const params = {
						Bucket: awsObject.bucket, // destination bucket
						CopySource: `/${sourceBucket}/${encodeURIComponent(oldPath)}`, // full source path (with bucket)
						Key: newPath, // destination path
					};
					return promisify(awsObject.s3.copyObject.bind(awsObject.s3), awsObject.s3)(params);
				});
			})
			.catch((err) => {
				logger.warning(err);
				throw err;
			});
	}

	deleteFile(userId, filename) {
		if (!userId || !filename) {
			return Promise.reject(new BadRequest('Missing parameters by deleteFile.', { userId, filename }));
		}
		return UserModel.userModel
			.findById(userId)
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}
				return createAWSObjectFromSchoolId(result.schoolId, aws).then((awsObject) => {
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
				});
			});
	}

	generateSignedUrl({ userId, flatFileName, fileType, header }) {
		if (!userId || !flatFileName || !fileType) {
			return Promise.reject(
				new BadRequest('Missing parameters by generateSignedUrl.', { userId, flatFileName, fileType })
			);
		}

		return UserModel.userModel
			.findById(userId)
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}
				return createAWSObjectFromSchoolId(result.schoolId, aws).then((awsObject) =>
					this.createIfNotExists(awsObject).then((safeAwsObject) => {
						const params = {
							Bucket: safeAwsObject.bucket,
							Key: flatFileName,
							Expires: Configuration.get('STORAGE_SIGNED_URL_EXPIRE'),
							ContentType: fileType,
							Metadata: header,
						};
						return promisify(safeAwsObject.s3.getSignedUrl.bind(safeAwsObject.s3), safeAwsObject.s3)(
							'putObject',
							params
						);
					})
				);
			});
	}

	async getSignedUrl({ storageProviderId, bucket, flatFileName, localFileName, download, action = 'getObject' }) {
		if (!storageProviderId || !bucket || !flatFileName) {
			return Promise.reject(
				new BadRequest('Missing parameters by getSignedUrl.', { storageProviderId, bucket, flatFileName })
			);
		}

		let awsObject;
		if (Configuration.get('FEATURE_MULTIPLE_S3_PROVIDERS_ENABLED') === true) {
			const storageProvider = await StorageProviderModel.findOne({ _id: storageProviderId }).lean().exec();

			if (!storageProvider) {
				throw new NotFound('Storage provider not found.');
			}

			const s3 = getS3(storageProvider, aws);
			awsObject = {
				s3,
				bucket,
			};
		} else {
			if (!awsConfig.endpointUrl) throw new Error('S3 integration is not configured on the server');
			const config = new aws.Config(awsConfig);
			config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);

			awsObject = {
				s3: new aws.S3(config),
				bucket,
			};
		}

		const params = {
			Bucket: bucket,
			Key: flatFileName,
			Expires: Configuration.get('STORAGE_SIGNED_URL_EXPIRE'),
		};

		if (getBoolean(download)) {
			params.ResponseContentDisposition = `attachment; filename = "${localFileName.replace('"', '')}"`;
		}

		return promisify(awsObject.s3.getSignedUrl.bind(awsObject.s3), awsObject.s3)(action, params);
	}
}

module.exports = AWSS3Strategy;
