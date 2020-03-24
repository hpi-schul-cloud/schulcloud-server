const { promisify } = require('es6-promisify');
const { BadRequest, NotFound, GeneralError } = require('@feathersjs/errors');
const aws = require('aws-sdk');
const pathUtil = require('path');
const fs = require('fs');
const logger = require('../../../logger');
const { schoolModel } = require('../../school/model');
const storageProviderModel = require('../../storageProvider/model');
const UserModel = require('../../user/model');
const filePermissionHelper = require('../utils/filePermissionHelper');
const { removeLeadingSlash } = require('../utils/filePathHelper');

const AbstractFileStorageStrategy = require('./interface.js');

const getCorsRules = () => ([{
	AllowedHeaders: ['*'],
	AllowedMethods: ['PUT'],
	AllowedOrigins: [process.env.HOST],
	MaxAgeSeconds: 300,
}]);

const getConfig = (provider) => {
	const awsConfig = new aws.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region || 'eu-de',
		endpointUrl: provider.endpointUrl,
		cors_rules: getCorsRules(),
	});
	awsConfig.endpoint = new aws.Endpoint(provider.endpointUrl);
	return awsConfig;
};

const createAWSObject = async (schoolId, provider) => {
	if (!provider) throw new Error('AWS integration is not configured on the server');

	return {
		s3: new aws.S3(getConfig(provider)),
		bucket: `bucket-${schoolId}`,
	};
};

/**
 * split files-list in files, that are in current directory, and the sub-directories
 * @param data is the files-list
 * @param path the current directory, everything else is filtered
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
		} else if (entry.name === '.scfake') { // prevent duplicates showing up by only considering .scfake
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

	return Promise.all(awsObjects.map((object) => headObject({ Bucket: bucketName, Key: object.Key })
		.then((res) => ({
			key: object.Key,
			name: getFileName(object.Key),
			path: getPath(res.Metadata.path),
			lastModified: res.LastModified,
			size: res.ContentLength,
			type: res.ContentType,
			thumbnail: res.Metadata.thumbnail,
		}))))
		.then((data) => splitFilesAndDirectories(storageContext, data));
};

class AWSS3Strategy extends AbstractFileStorageStrategy {
	async create(schoolId) {
		if (!schoolId) {
			throw new BadRequest('No school id parameter given.');
		}

		let { storageProvider } = await schoolModel.findOne({ _id: schoolId })
			.populate({ path: 'storageProvider', model: storageProviderModel })
			.lean().exec()
			.then((school) => {
				if (school === null) {
					throw new NotFound('School not found.');
				}
				return school;
			});

		if (!storageProvider) {
			storageProvider = await storageProviderModel.findOne({ isShared: true }).lean().exec()
				.then((provider) => {
					if (provider === null) {
						throw new NotFound('No available provider found.');
					}
					return provider;
				});
		}

		return new Promise((resolve, reject) => {
			const awsObject = createAWSObject(schoolId, storageProvider);
			return promisify(awsObject.s3.createBucket.bind(awsObject.s3), awsObject.s3)({ Bucket: awsObject.bucket })
				.then((res) => {
					/* Sets the CORS configuration for a bucket. */
					awsObject.s3.putBucketCors({
						Bucket: awsObject.bucket,
						CORSConfiguration: {
							CORSRules: getCorsRules(),
						},
					}, (err) => {	// define and pass error handler
						if (err) {
							logger.warning(err);
						}
						reject(err);
					});
					resolve({
						message: 'Successfully created s3-bucket!',
						data: res,
						code: 200,
					});
				}).catch((err) => reject(new Error(err)));
		});
	}

	createIfNotExists(awsObject) {
		return new Promise((resolve, reject) => {
			const params = {
				Bucket: awsObject.bucket,
			};
			awsObject.s3.headBucket(params, (err) => {
				if (err && err.statusCode === 404) {
					logger.info(`Bucket ${awsObject.bucket} does not exist - creating ... `);

					awsObject.s3.createBucket({ Bucket: awsObject.bucket }, (err) => {
						if (err) {
							reject(err);
						}

						logger.info(`Bucket ${awsObject.bucket} created ... `);
						awsObject.s3.putBucketCors({
							Bucket: awsObject.bucket,
							CORSConfiguration: {
								CORSRules: getCorsRules(),
							},
						},
						(err) => {
							if (err) {
								reject(err);
							}
							resolve(awsObject);
						});
					});

					return;
				}

				logger.info(`Bucket ${awsObject.bucket} does exist`);
				resolve(awsObject);
			});
		});
	}

	/** @DEPRECATED * */
	getFiles(userId, path) {
		logger.warning('@deprecated');
		if (!userId || !path) {
			return Promise.reject(new BadRequest('Missing parameters by getFiles.'));
		}
		return filePermissionHelper.checkPermissions(userId, path)
			.then((res) => UserModel.userModel.findById(userId).exec())
			.then((result) => {
				if (!result) {
					return new NotFound('User not found');
				}
				if (!result.schoolId) {
					return new GeneralError('school not set');
				}

				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: path,
				};
				return promisify(awsObject.s3.listObjectsV2.bind(awsObject.s3), awsObject.s3)(params)
					.then((res) => Promise.resolve(getFileMetadata(path, res.Contents, awsObject.bucket, awsObject.s3)));
			});
	}

	copyFile(userId, oldPath, newPath, externalSchoolId) {
		if (!userId || !oldPath || !newPath) {
			return Promise.reject(new BadRequest('Missing parameters by copyFile.', { userId, oldPath, newPath }));
		}
		return UserModel.userModel.findById(userId).lean().exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}

				const awsObject = createAWSObject(result.schoolId);
				// files can be copied to different schools
				const sourceBucket = `bucket-${externalSchoolId || result.schoolId}`;

				const params = {
					Bucket: awsObject.bucket, // destination bucket
					CopySource: `/${sourceBucket}/${encodeURIComponent(oldPath)}`, // full source path (with bucket)
					Key: newPath, // destination path
				};
				return promisify(awsObject.s3.copyObject.bind(awsObject.s3), awsObject.s3)(params);
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
		return UserModel.userModel.findById(userId).exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}
				const awsObject = createAWSObject(result.schoolId);
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
	}

	generateSignedUrl({ userId, flatFileName, fileType }) {
		if (!userId || !flatFileName || !fileType) {
			return Promise.reject(
				new BadRequest('Missing parameters by generateSignedUrl.', { userId, flatFileName, fileType }),
			);
		}

		return UserModel.userModel.findById(userId).exec()
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}

				const awsObject = createAWSObject(result.schoolId);
				return this.createIfNotExists(awsObject);
			})
			.then((awsObject) => {
				const params = {
					Bucket: awsObject.bucket,
					Key: flatFileName,
					Expires: 60,
					ContentType: fileType,
				};

				return promisify(awsObject.s3.getSignedUrl.bind(awsObject.s3), awsObject.s3)('putObject', params);
			});
	}

	getSignedUrl({
		userId, flatFileName, localFileName, download, action = 'getObject',
	}) {
		if (!userId || !flatFileName) {
			return Promise.reject(new BadRequest('Missing parameters by getSignedUrl.', { userId, flatFileName }));
		}

		return UserModel.userModel.findById(userId).lean().exec().then((result) => {
			if (!result || !result.schoolId) {
				return new NotFound('User not found');
			}

			const awsObject = createAWSObject(result.schoolId);
			const params = {
				Bucket: awsObject.bucket,
				Key: flatFileName,
				Expires: 60,
			};
			const getBoolean = (value) => value === true || value === 'true';
			if (getBoolean(download)) {
				params.ResponseContentDisposition = `attachment; filename = "${localFileName.replace('"', '')}"`;
			}
			return promisify(awsObject.s3.getSignedUrl.bind(awsObject.s3), awsObject.s3)(action, params);
		});
	}

	/** ** @DEPRECATED *** */
	createDirectory(userId, path) {
		logger.warning('@deprecated');
		if (!userId || !path) {
			return Promise.reject(new BadRequest('Missing parameters by createDirectory'));
		}
		return filePermissionHelper.checkPermissions(userId, path)
			.then((res) => {
				// eslint-disable-next-line no-param-reassign
				if (path[0] === '/') path = path.substring(1);
				return UserModel.userModel.findById(userId).exec().then((result) => {
					if (!result || !result.schoolId) {
						return new NotFound('User not found');
					}

					const awsObject = createAWSObject(result.schoolId);
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
	}

	/** ** @DEPRECATED *** */
	deleteDirectory(userId, path) {
		logger.warning('@deprecated');
		if (!userId || !path) {
			return Promise.reject(new BadRequest('Missing parameters by deleteDirectory.'));
		}
		return filePermissionHelper.checkPermissions(userId, path)
			.then((res) => UserModel.userModel.findById(userId).exec())
			.then((result) => {
				if (!result || !result.schoolId) {
					return new NotFound('User not found');
				}
				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: removeLeadingSlash(path),
				};
				return this.deleteAllInDirectory(awsObject, params);
			});
	}

	/** ** @DEPRECATED *** */
	deleteAllInDirectory(awsObject, params) {
		logger.warning('@deprecated');
		return promisify(awsObject.s3.listObjectsV2.bind(awsObject.s3), awsObject.s3)(params)
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
