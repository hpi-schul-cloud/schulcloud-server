const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const SchoolModel = require('../../school/model');
const UserModel = require('../../user/model');
const CourseModel = require('../../user-group/model').courseModel;
const ClassModel = require('../../user-group/model').classModel;
const aws = require('aws-sdk');
const fs = require('fs');
const pathUtil = require('path').posix;
const logger = require('winston');
let awsConfig;
try {
	awsConfig = require("../../../../config/secrets.json").aws;
} catch (e) {
	logger.log('warn', 'The AWS config couldn\'t be read');
	awsConfig = {};
}

const AbstractFileStorageStrategy = require('./interface.js');

/**
 * verifies whether the given userId has permission for the given directory (course, user, class)
 * @param userId [String]
 * @param path [String], e.g. users/{userId}
 * @returns {*}
 */
const checkPermissions = (userId, path) => {
	var values = path.split("/");
	if (values.length < 2) return Promise.reject(new errors.BadRequest("Path is invalid"));
	const contextType = values[0];
	const contextId = values[1];
	switch (contextType) {
		case 'users':	// user's own files
			if (contextId != userId.toString()) {
				return Promise.reject(new errors.Forbidden("You don't have permissions!"));
			} else {
				return Promise.resolve();
			}
		case 'courses':
			// checks, a) whether the user is student or teacher of the course, b) the course exists
			return CourseModel.find({
				$and: [
					{$or: [{userIds: userId}, {teacherIds: userId}]},
					{_id: contextId}
				]
			}).exec().then(res => {
				if (!res || res.length <= 0) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return Promise.resolve(res);
			});
		case 'classes':
			// checks, a) whether the user is student or teacher of the class, b) the class exists
			return ClassModel.find({
				$and: [
					{$or: [{userIds: userId}, {teacherIds: userId}]},
					{_id: contextId}
				]
			}).exec().then(res => {
				if (!res || res.length <= 0) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return Promise.resolve(res);
			});
		default:
			return Promise.reject("StorageContext is invalid");
	}
};

const createAWSObject = (schoolId) => {
	if (!awsConfig.endpointUrl) throw new Error('AWS integration is not configured on the server');
	var config = new aws.Config(awsConfig);
	config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);
	let bucketName = `bucket-${schoolId}`;
	var s3 = new aws.S3(config);
	return {s3: s3, bucket: bucketName};
};

/**
 * split files-list in files, that are in current directory, and the sub-directories
 * @param data is the files-list
 * @param path the current directory, everything else is filtered
 */
const splitFilesAndDirectories = (path, data) => {
	let files = [];
	let directories = [];

	// gets name of current directory
	let values = path.split("/").filter((v, index) => {
		return v && index > 1;
	});
	let currentDir = values.join("/");
	let currentDirRegEx = new RegExp("^(\/|)" + currentDir + '(\/|)', "i");

	data.forEach(entry => {
		if (!entry.path.match(currentDirRegEx)) return;
		const relativePath = entry.path.replace(currentDirRegEx, '');

		if (relativePath === '') {
			files.push(entry);
		} else {
			directories.push(relativePath.split("/")[0]);
		}
	});


	// delete duplicates in directories
	let withoutDuplicates = [];
	directories.forEach(d => {
		if (withoutDuplicates.indexOf(d) == -1) withoutDuplicates.push(d);
	});

	// remove .scfake fake file
	files = files.filter(f => f.name != ".scfake");

	return {
		files: files,
		directories: withoutDuplicates.map(v => {
			return {
				name: v
			};
		})
	};
};

const getFileMetadata = (storageContext, awsObjects, bucketName, s3) => {
	const headObject = promisify(s3.headObject, s3);
	const _getPath = (path) => {
		if (!path) {
			return "/";
		}

		// remove first and second directory from storageContext because it's just meta
		return `/${path.split("/").filter((v, index) => index > 1).join("/")}`;
	};

	const _getFileName = (path) => {
		if (!path) {
			return "";
		}

		// a file's name is in the last part of the path
		let values = path.split("/");
		return values[values.length - 1];
	};

	return Promise.all(awsObjects.map((object) => {

		return headObject({Bucket: bucketName, Key: object.Key})
			.then(res => {
				return {
					key: object.Key,
					name: _getFileName(object.Key),
					path: _getPath(res.Metadata.path),
					lastModified: res.LastModified,
					size: res.ContentLength,
					type: res.ContentType,
					thumbnail: res.Metadata.thumbnail
				};
			});
	}))
		.then(data => {
			return splitFilesAndDirectories(storageContext, data);
		});
};

class AWSS3Strategy extends AbstractFileStorageStrategy {

	create(schoolId) {
		if (!schoolId) return Promise.reject(new errors.BadRequest('No school id parameter given'));
		return SchoolModel.findById(schoolId).exec()
			.then((result) => {
				if (!result) return Promise.reject(new errors.NotFound('school not found'));
				const awsObject = createAWSObject(result._id);
				const createBucket = promisify(awsObject.s3.createBucket, awsObject.s3);
				return createBucket({Bucket: awsObject.bucket})
					.then(res => Promise.resolve({message: "Successfully created s3-bucket!", data: res}));
			});
	}

	getFiles(userId, path) {
		if (!userId || !path) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return checkPermissions(userId, path)
			.then(res => UserModel.findById(userId).exec())
			.then(result => {
				if (!result) return Promise.reject(errors.NotFound("User not found"));
				if(!result.schoolId) return Promise.reject(errors.GeneralError("school not set"));

				var awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: path
				};
				return promisify(awsObject.s3.listObjectsV2, awsObject.s3)(params)
					.then(res => {
						return Promise.resolve(getFileMetadata(path, res.Contents, awsObject.bucket, awsObject.s3));
					});
			});
	}

	deleteFile(userId, path) {
		if (!userId || !path) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return checkPermissions(userId, path)
			.then(res => UserModel.findById(userId).exec())
			.then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));
				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Delete: {
						Objects: [
							{
								Key: path
							}
						],
						Quiet: true
					}
				};
				return promisify(awsObject.s3.deleteObjects, awsObject.s3)(params);
			});
	}

	generateSignedUrl(userId, path, fileType, action) {
		if (!userId || !path || !action || (action == 'putObject' && !fileType)) return Promise.reject(new errors.BadRequest('Missing parameters'));
		const fileName = pathUtil.basename(path);
		const dirName = pathUtil.dirname(path);
		return checkPermissions(userId, path)
			.then(() => {
				return UserModel.findById(userId).exec().then(result => {
					if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

					const awsObject = createAWSObject(result.schoolId);
					let params = {
						Bucket: awsObject.bucket,
						Key: path,
						Expires: 60
					};

					if (action == 'putObject') params.ContentType = fileType;

					return promisify(awsObject.s3.getSignedUrl, awsObject.s3)(action, params)
						.then(res => Promise.resolve({
							url: res,
							header: {
								"Content-Type": fileType,
								"x-amz-meta-path": dirName,
								"x-amz-meta-name": fileName,
								"x-amz-meta-thumbnail": "https://schulcloud.org/images/login-right.png"
							}
						}));
				});
			});
	}

	createDirectory(userId, path) {
		if (!userId || !path) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return checkPermissions(userId, path)
			.then(res => {
				return UserModel.findById(userId).exec().then(result => {
					if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

					const awsObject = createAWSObject(result.schoolId);
					var fileStream = fs.createReadStream(pathUtil.join(__dirname, '..', 'resources', '.scfake'));
					let params = {
						Bucket: awsObject.bucket,
						Key: `${path}/.scfake`,
						Body: fileStream,
						Metadata: {
							path: path,
							name: '.scfake'
						}
					};

					return promisify(awsObject.s3.putObject, awsObject.s3)(params);
				});
			});
	}

	deleteDirectory(userId, path) {
		if (!userId || !path) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return checkPermissions(userId, path)
			.then(res => UserModel.findById(userId).exec())
			.then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));
				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: path
				};
				return this._deleteAllInDirectory(awsObject, params);
			});
	}

	_deleteAllInDirectory(awsObject, params) {
		return promisify(awsObject.s3.listObjectsV2, awsObject.s3)(params)
			.then(data => {
				if (data.Contents.length == 0) throw new Error(`Invalid Prefix ${params.Prefix}`); // there should always be at least the .scfake file

				const deleteParams = {Bucket: params.Bucket, Delete: {}};
				deleteParams.Delete.Objects = data.Contents.map(c => ({Key: c.Key}));

				return promisify(awsObject.s3.deleteObjects, awsObject.s3)(deleteParams);
			})
			.then(deletionData => {
				if (deletionData.Deleted.length == 1000) return this._deleteAllInDirectory(awsObject, params);	// AWS S3 returns only 1000 items at once
				else return Promise.resolve(deletionData);
			});
	}
}

module.exports = AWSS3Strategy;
