const { promisify } = require('es6-promisify');
const CryptoJS = require('crypto-js');

const { Configuration } = require('@hpi-schul-cloud/commons');
const aws = require('aws-sdk');
const pathUtil = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { NotFound, BadRequest, GeneralError } = require('../../../errors');
const logger = require('../../../logger');
const { schoolModel } = require('../../school/model');
const { StorageProviderModel } = require('../../storageProvider/model');
const UserModel = require('../../user/model');
const filePermissionHelper = require('../utils/filePermissionHelper');
const { removeLeadingSlash } = require('../utils/filePathHelper');
const { updateProviderForSchool, findProviderForSchool } = require('../utils/providerAssignmentHelper');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');

const HOST = Configuration.get('HOST');
const BUCKET_NAME_PREFIX = 'bucket-';
const AbstractFileStorageStrategy = require('./interface.js');

const getCorsRules = () => [
	{
		AllowedHeaders: ['*'],
		AllowedMethods: ['PUT'],
		AllowedOrigins: [HOST],
		MaxAgeSeconds: 300,
	},
];

const getConfig = (provider) => {
	const awsConfig = new aws.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region,
		endpointUrl: provider.endpointUrl,
	});
	if (Configuration.get('FEATURE_S3_BUCKET_CORS') === true) {
		awsConfig.cors_rules = getCorsRules();
	}
	awsConfig.endpoint = new aws.Endpoint(provider.endpointUrl);
	return awsConfig;
};

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
let awsConfig = {};
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

const getS3 = (storageProvider) => {
	const S3_KEY = Configuration.get('S3_KEY');
	storageProvider.secretAccessKey = CryptoJS.AES.decrypt(storageProvider.secretAccessKey, S3_KEY).toString(
		CryptoJS.enc.Utf8
	);
	return new aws.S3(getConfig(storageProvider));
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

const createAWSObject = async (schoolId) => {
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
		const s3 = getS3(school.storageProvider);
		return {
			s3,
			bucket: getBucketName(schoolId),
		};
	}

	// begin legacy
	if (!awsConfig.endpointUrl) throw new Error('S3 integration is not configured on the server');
	const config = new aws.Config(awsConfig);
	config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);

	return {
		s3: new aws.S3(config),
		bucket: getBucketName(schoolId),
	};
	// end legacy
};

/**
 * split files-list in files, that are in current directory, and the sub-directories
 * @param data is the files-list
 * @param _path the current directory, everything else is filtered
 */
const splitFilesAndDirectories = (_path, data) => {
	const path = removeLeadingSlash(_path);
	let files = [];
	const directories = [];

	data.forEach((entry) => {
		const relativePath = removeLeadingSlash(entry.key.replace(path, ''));
		const pathComponents = relativePath.split('/');

		if (pathComponents.length === 1) {
			files.push(entry);
		} else if (entry.name === '.scfake') {
			// prevent duplicates showing up by only considering .scfake
			const components = entry.key.split('/');
			const directoryName = components[components.length - 2]; // the component before '.scfake'
			directories.push({
				name: directoryName,
			});
		}
	});

	// remove .scfake fake file
	files = files.filter((f) => f.name !== '.scfake');

	return {
		files,
		directories,
	};
};

const getFileMetadata = (storageContext, awsObjects, bucketName, s3) => {
	const headObject = promisify(s3.headObject.bind(s3), s3);
	const getPath = (path) => {
		if (!path) {
			return '/';
		}

		let pathComponents = path.split('/');
		if (pathComponents[0] === '') pathComponents = pathComponents.slice(1); // omit leading slash
		// remove first and second directory from storageContext because it's just meta
		return `/${pathComponents.slice(2).join('/')}`;
	};

	const getFileName = (path) => {
		if (!path) {
			return '';
		}

		// a file's name is in the last part of the path
		const values = path.split('/');
		return values[values.length - 1];
	};
	awsObjects.forEach((e) => {
		e.Key = removeLeadingSlash(e.Key);
	});

	return Promise.all(
		awsObjects.map((object) =>
			headObject({ Bucket: bucketName, Key: object.Key }).then((res) => ({
				key: object.Key,
				name: getFileName(object.Key),
				path: getPath(res.Metadata.path),
				lastModified: res.LastModified,
				size: res.ContentLength,
				type: res.ContentType,
				thumbnail: res.Metadata.thumbnail,
			}))
		)
	).then((data) => splitFilesAndDirectories(storageContext, data));
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
const reassignProviderForSchool = async (awsObject) => {
	const schoolId = awsObject.bucket.replace(BUCKET_NAME_PREFIX, '');
	const storageProviders = await StorageProviderModel.find().lean().exec();
	const bucketsForProvider = {};
	for (const provider of storageProviders) {
		const config = getS3(provider);
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
const createBucket = async (awsObject) => {
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
			return reassignProviderForSchool(awsObject);
		}
		throw err;
	}
};

class AWSS3Strategy extends AbstractFileStorageStrategy {
	connect(storageProvider) {
		return getS3(storageProvider);
	}

	async create(schoolId) {
		if (!schoolId) {
			throw new BadRequest('No school id parameter given.');
		}

		const awsObject = await createAWSObject(schoolId);
		const data = await createBucket(awsObject);
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
				const response = await createBucket(awsObject);
				logger.info(`Bucket ${response.bucket} created ... `);

				return response;
			}
			throw err;
		}
	}

	/** @DEPRECATED * */
	getFiles(userId, path) {
		logger.warning('@deprecated');
		if (!userId || !path) {
			return Promise.reject(new BadRequest('Missing parameters by getFiles.'));
		}
		return filePermissionHelper
			.checkPermissions(userId, path)
			.then((res) => UserModel.userModel.findById(userId).exec())
			.then((result) => {
				if (!result) {
					return new NotFound('User not found');
				}
				if (!result.schoolId) {
					return new GeneralError('school not set');
				}

				return createAWSObject(result.schoolId).then((awsObject) => {
					const params = {
						Bucket: awsObject.bucket,
						Prefix: path,
					};
					return promisify(
						awsObject.s3.listObjectsV2.bind(awsObject.s3),
						awsObject.s3
					)(params).then((res) => Promise.resolve(getFileMetadata(path, res.Contents, awsObject.bucket, awsObject.s3)));
				});
			});
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

				return createAWSObject(result.schoolId).then((awsObject) => {
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
				return createAWSObject(result.schoolId).then((awsObject) => {
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
				return createAWSObject(result.schoolId).then((awsObject) =>
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

	getSignedUrl({ userId, flatFileName, localFileName, download, action = 'getObject', bucket = undefined }) {
		if (!userId || !flatFileName) {
			return Promise.reject(new BadRequest('Missing parameters by getSignedUrl.', { userId, flatFileName }));
		}

		return UserModel.userModel
			.findById(userId)
			.lean()
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}

				return createAWSObject(result.schoolId).then((awsObject) => {
					const params = {
						Bucket: bucket || awsObject.bucket,
						Key: flatFileName,
						Expires: Configuration.get('STORAGE_SIGNED_URL_EXPIRE'),
					};
					const getBoolean = (value) => value === true || value === 'true';
					if (getBoolean(download)) {
						params.ResponseContentDisposition = `attachment; filename = "${localFileName.replace('"', '')}"`;
					}
					return promisify(awsObject.s3.getSignedUrl.bind(awsObject.s3), awsObject.s3)(action, params);
				});
			});
	}

	/** ** @DEPRECATED *** */
	createDirectory(userId, path) {
		logger.warning('@deprecated');
		if (!userId || !path) {
			return Promise.reject(new BadRequest('Missing parameters by createDirectory'));
		}
		return filePermissionHelper.checkPermissions(userId, path).then((res) => {
			// eslint-disable-next-line no-param-reassign
			if (path[0] === '/') path = path.substring(1);
			return UserModel.userModel
				.findById(userId)
				.exec()
				.then((result) => {
					if (!result || !result.schoolId) {
						return new NotFound('User not found');
					}

					return createAWSObject(result.schoolId).then((awsObject) => {
						const fileStream = fs.createReadStream(pathUtil.join(__dirname, '..', 'resources', '.scfake'));
						const params = {
							Bucket: awsObject.bucket,
							Key: `${path}/.scfake`,
							Body: fileStream,
							Metadata: {
								path,
								name: '.scfake',
							},
						};

						return promisify(awsObject.s3.putObject.bind(awsObject.s3), awsObject.s3)(params);
					});
				});
		});
	}

	/** ** @DEPRECATED *** */
	deleteDirectory(userId, path) {
		logger.warning('@deprecated');
		if (!userId || !path) {
			return Promise.reject(new BadRequest('Missing parameters by deleteDirectory.'));
		}
		return filePermissionHelper
			.checkPermissions(userId, path)
			.then((res) => UserModel.userModel.findById(userId).exec())
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}
				return createAWSObject(result.schoolId).then((awsObject) => {
					const params = {
						Bucket: awsObject.bucket,
						Prefix: removeLeadingSlash(path),
					};
					return this.deleteAllInDirectory(awsObject, params);
				});
			});
	}

	/** ** @DEPRECATED *** */
	deleteAllInDirectory(awsObject, params) {
		logger.warning('@deprecated');
		return promisify(
			awsObject.s3.listObjectsV2.bind(awsObject.s3),
			awsObject.s3
		)(params)
			.then((data) => {
				// there should always be at least the .scfake file
				if (data.Contents.length === 0) {
					throw new Error(`Invalid Prefix ${params.Prefix}`);
				}

				const deleteParams = { Bucket: params.Bucket, Delete: {} };
				deleteParams.Delete.Objects = data.Contents.map((c) => ({ Key: c.Key }));

				return promisify(awsObject.s3.deleteObjects.bind(awsObject.s3), awsObject.s3)(deleteParams);
			})
			.then((deletionData) => {
				// AWS S3 returns only 1000 items at once
				if (deletionData.Deleted.length === 1000) return this.deleteAllInDirectory(awsObject, params);
				return Promise.resolve(deletionData);
			});
	}
}

module.exports = AWSS3Strategy;
