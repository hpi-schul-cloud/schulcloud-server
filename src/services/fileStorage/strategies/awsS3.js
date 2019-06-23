const promisify = require('es6-promisify');
const errors = require('@feathersjs/errors');
const aws = require('aws-sdk');
const { posix: pathUtil } = require('path');
const logger = require('winston');
const fs = require('fs');

const SchoolModel = require('../../school/model');
const UserModel = require('../../user/model');
const filePermissionHelper = require('../utils/filePermissionHelper');
const { removeLeadingSlash } = require('../utils/filePathHelper');

// const prodMode = process.env.NODE_ENV === 'production';

let awsConfig = {};
try {
	//	awsConfig = require(`../../../../config/secrets.${prodMode ? 'js' : 'json'}`).aws;
	(['production'].includes(process.env.NODE_ENV))
		? (awsConfig = require('../../../../config/secrets.js').aws)
		: (awsConfig = require('../../../../config/secrets.json').aws);
} catch (e) {
	logger.log('warn', "The AWS config couldn't be read");
}

const AbstractFileStorageStrategy = require('./interface.js');

const createAWSObject = (schoolId) => {
	if (!awsConfig.endpointUrl) { throw new Error('AWS integration is not configured on the server'); }

	const config = new aws.Config(awsConfig);
	config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);

	return {
		s3: new aws.S3(config),
		bucket: `bucket-${schoolId}`,
	};
};

/**
 * split files-list in files, that are in current directory, and the sub-directories
 * @param data is the files-list
 * @param path the current directory, everything else is filtered
 */
const splitFilesAndDirectories = (path, data) => {
	path = removeLeadingSlash(path);
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
	files = files.filter(f => f.name !== '.scfake');

	return {
		files,
		directories,
	};
};

const getFileMetadata = (storageContext, awsObjects, bucketName, s3) => {
	const headObject = promisify(s3.headObject, s3);
	const _getPath = (path) => {
		if (!path) {
			return '/';
		}

		let pathComponents = path.split('/');
		if (pathComponents[0] === '') pathComponents = pathComponents.slice(1); // omit leading slash
		// remove first and second directory from storageContext because it's just meta
		return `/${pathComponents.slice(2).join('/')}`;
	};

	const _getFileName = (path) => {
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
		awsObjects.map(object => headObject({ Bucket: bucketName, Key: object.Key }).then(
			res => ({
				key: object.Key,
				name: _getFileName(object.Key),
				path: _getPath(res.Metadata.path),
				lastModified: res.LastModified,
				size: res.ContentLength,
				type: res.ContentType,
				thumbnail: res.Metadata.thumbnail,
			}),
		)),
	).then(data => splitFilesAndDirectories(storageContext, data));
};

class AWSS3Strategy extends AbstractFileStorageStrategy {
	create(schoolId) {
		if (!schoolId) {
			return Promise.reject(
				new errors.BadRequest('No school id parameter given'),
			);
		}
		return SchoolModel.schoolModel
			.findById(schoolId)
			.exec()
			.then((result) => {
				if (!result) {
					return Promise.reject(
						new errors.NotFound('school not found'),
					);
				}
				const awsObject = createAWSObject(result._id);
				const createBucket = promisify(
					awsObject.s3.createBucket,
					awsObject.s3,
				);
				return createBucket({ Bucket: awsObject.bucket }).then(res => Promise.resolve({
					message: 'Successfully created s3-bucket!',
					data: res,
				}));
			});
	}

	createIfNotExists(awsObject) {
		return new Promise((resolve, reject) => {
			const params = {
				Bucket: awsObject.bucket,
			};
			awsObject.s3.headBucket(params, (err) => {
				if (err && err.statusCode === 404) {
					logger.info(
						`Bucket ${
							awsObject.bucket
						} does not exist - creating ... `,
					);

					awsObject.s3.createBucket(
						{ Bucket: awsObject.bucket },
						(err) => {
							if (err) {
								reject(err);
							}

							logger.info(
								`Bucket ${awsObject.bucket} created ... `,
							);
							awsObject.s3.putBucketCors(
								{
									Bucket: awsObject.bucket,
									CORSConfiguration: {
										CORSRules: awsConfig.cors_rules,
									},
								},
								(err) => {
									if (err) {
										reject(err);
									}
									resolve(awsObject);
								},
							);
						},
					);

					return;
				}

				logger.info(`Bucket ${awsObject.bucket} does exist`);
				resolve(awsObject);
			});
		});
	}

	/** @DEPRECATED * */
	getFiles(userId, path) {
		if (!userId || !path) { return Promise.reject(new errors.BadRequest('Missing parameters')); }
		return filePermissionHelper
			.checkPermissions(userId, path)
			.then(res => UserModel.userModel.findById(userId).exec())
			.then((result) => {
				if (!result) { return Promise.reject(errors.NotFound('User not found')); }
				if (!result.schoolId) {
					return Promise.reject(
						errors.GeneralError('school not set'),
					);
				}

				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: path,
				};
				return promisify(awsObject.s3.listObjectsV2, awsObject.s3)(
					params,
				).then(res => Promise.resolve(
					getFileMetadata(
						path,
						res.Contents,
						awsObject.bucket,
						awsObject.s3,
					),
				));
			});
	}

	copyFile(userId, oldPath, newPath, externalSchoolId) {
		if (!userId || !oldPath || !newPath) {
			return Promise.reject(new errors.BadRequest('Missing parameters'));
		}
		return UserModel.userModel
			.findById(userId)
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) { return Promise.reject(errors.NotFound('User not found')); }

				const awsObject = createAWSObject(result.schoolId);
				const sourceBucket = `bucket-${externalSchoolId
					|| result.schoolId}`; // files can be copied to different schools

				const params = {
					Bucket: awsObject.bucket, // destination bucket
					CopySource: `/${sourceBucket}/${encodeURIComponent(
						oldPath,
					)}`, // full source path (with bucket)
					Key: newPath, // destination path
				};

				return promisify(awsObject.s3.copyObject, awsObject.s3)(params);
			});
	}

	deleteFile(userId, filename) {
		if (!userId || !filename) { return Promise.reject(new errors.BadRequest('Missing parameters')); }
		return UserModel.userModel
			.findById(userId)
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) { return Promise.reject(errors.NotFound('User not found')); }
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
				return promisify(awsObject.s3.deleteObjects, awsObject.s3)(
					params,
				);
			});
	}

	generateSignedUrl({ userId, flatFileName, fileType }) {
		if (!userId || !flatFileName || !fileType) {
			return Promise.reject(new errors.BadRequest('Missing parameters'));
		}

		return UserModel.userModel
			.findById(userId)
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) { return Promise.reject(errors.NotFound('User not found')); }

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

				return promisify(awsObject.s3.getSignedUrl, awsObject.s3)(
					'putObject',
					params,
				);
			});
	}

	getSignedUrl({
		userId,
		flatFileName,
		localFileName,
		download,
		action = 'getObject',
		Expires = 60,
	}) {
		if (!userId || !flatFileName) { return Promise.reject(new errors.BadRequest('Missing parameters')); }

		return UserModel.userModel
			.findById(userId)
			.exec()
			.then((result) => {
				if (!result || !result.schoolId) { return Promise.reject(errors.NotFound('User not found')); }

				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Key: flatFileName,
					Expires,
				};

				if (download) {
					params.ResponseContentDisposition = `attachment; filename = ${localFileName}`;
				}

				return promisify(awsObject.s3.getSignedUrl, awsObject.s3)(
					action,
					params,
				);
			});
	}

	/** ** @DEPRECATED *** */
	createDirectory(userId, path) {
		if (!userId || !path) { return Promise.reject(new errors.BadRequest('Missing parameters')); }
		return filePermissionHelper.checkPermissions(userId, path).then((res) => {
			if (path[0] === '/') path = path.substring(1);
			return UserModel.userModel
				.findById(userId)
				.exec()
				.then((result) => {
					if (!result || !result.schoolId) {
						return Promise.reject(
							errors.NotFound('User not found'),
						);
					}

					const awsObject = createAWSObject(result.schoolId);
					const fileStream = fs.createReadStream(
						pathUtil.join(__dirname, '..', 'resources', '.scfake'),
					);
					const params = {
						Bucket: awsObject.bucket,
						Key: `${path}/.scfake`,
						Body: fileStream,
						Metadata: {
							path,
							name: '.scfake',
						},
					};

					return promisify(awsObject.s3.putObject, awsObject.s3)(
						params,
					);
				});
		});
	}

	/** ** @DEPRECATED *** */
	deleteDirectory(userId, path) {
		if (!userId || !path) { return Promise.reject(new errors.BadRequest('Missing parameters')); }
		return filePermissionHelper
			.checkPermissions(userId, path)
			.then(res => UserModel.userModel.findById(userId).exec())
			.then((result) => {
				if (!result || !result.schoolId) { return Promise.reject(errors.NotFound('User not found')); }
				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: removeLeadingSlash(path),
				};
				return this._deleteAllInDirectory(awsObject, params);
			});
	}

	/** ** @DEPRECATED *** */
	_deleteAllInDirectory(awsObject, params) {
		return promisify(awsObject.s3.listObjectsV2, awsObject.s3)(params)
			.then((data) => {
				if (data.Contents.length === 0) {
					throw new Error(`Invalid Prefix ${params.Prefix}`);
				} // there should always be at least the .scfake file

				const deleteParams = { Bucket: params.Bucket, Delete: {} };
				deleteParams.Delete.Objects = data.Contents.map(c => ({
					Key: c.Key,
				}));

				return promisify(awsObject.s3.deleteObjects, awsObject.s3)(
					deleteParams,
				);
			})
			.then((deletionData) => {
				if (deletionData.Deleted.length === 1000) { return this._deleteAllInDirectory(awsObject, params); }
				// AWS S3 returns only 1000 items at once
				return Promise.resolve(deletionData);
			});
	}
}

module.exports = AWSS3Strategy;
