const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const SchoolModel = require('../../school/model');
const UserModel = require('../../user/model');
const CourseModel = require('../../user-group/model').courseModel;
const ClassModel = require('../../user-group/model').classModel;
const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');
let awsConfig;
try {
	awsConfig = require("../../../../config/secrets.json").aws;
} catch (e) {
	awsConfig = {};
}

const AbstractFileStorageStrategy = require('./interface.js');

/**
 * verifies whether the given userId has permission for the given context (course, user, class)
 * @param userId [String]
 * @param storageContext [String], e.g. users/{userId}
 * @returns {*}
 */
const verifyStorageContext = (userId, storageContext) => {
	var values = storageContext.split("/");
	if (values.length < 2) return Promise.reject(new errors.BadRequest("StorageContext is invalid"));
	var context = values[0];
	switch (context) {
		case 'users':
			return UserModel.findById(values[1]).exec()
				.then(res => {
					if (!res || res._id != userId.toString()) {
						return Promise.reject(new errors.Forbidden("You don't have permissions!"));
					}
					return Promise.resolve(res);
				});
		case 'courses':
			// checks, a) whether the user is student or teacher of the course, b) the course exists
			return CourseModel.find({$and: [
				{$or:[{userIds: userId}, {teacherIds: userId}]},
				{_id: values[1]}
			]}).exec().then(res => {
				if (!res || res.length <= 0) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return Promise.resolve(res);
			});
		case 'classes':
			// checks, a) whether the user is student or teacher of the class, b) the class exists
			return ClassModel.find({$and: [
				{$or:[{userIds: userId}, {teacherIds: userId}]},
				{_id: values[1]}
			]}).exec().then(res => {
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
	var config = new aws.Config(awsConfig);
	config.endpoint = new aws.Endpoint(awsConfig.endpointUrl);
	let bucketName = `bucket-${schoolId}`;
	var s3 = new aws.S3(config);
	return {s3: s3, bucket: bucketName};
};

/**
 * split files-list in files, that are in current directory, and the sub-directories
 * @param data is the files-list
 */
const splitFilesAndDirectories = (storageContext, data) => {
	let files = [];
	let directories = [];

	// gets name of current directory
	let values = storageContext.split("/").filter((v, index) => {
		return v && index > 1;
	});
	let currentDir = values.join("/");
	let currentDirRegEx = new RegExp("^(\/|)" + currentDir + '(\/|)', "i");

	data.forEach(entry => {
		if(!entry.path.match(currentDirRegEx)) return;
		const relativePath = entry.path.replace(currentDirRegEx, '');

		if(relativePath === '') {
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

	getFiles(userId, storageContext) {
		if (!userId || !storageContext) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext)
			.then(res => UserModel.findById(userId).exec())
			.then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

				var awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Prefix: storageContext
				};
				return promisify(awsObject.s3.listObjectsV2, awsObject.s3)(params)
					.then(res => {
						return Promise.resolve(getFileMetadata(storageContext, res.Contents, awsObject.bucket, awsObject.s3));
					});
			});
	}

	deleteFile(userId, storageContext, fileName) {
		if (!userId || !storageContext || !fileName) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext)
			.then(res => UserModel.findById(userId).exec())
			.then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));
				const awsObject = createAWSObject(result.schoolId);
				const params = {
					Bucket: awsObject.bucket,
					Delete: {
						Objects: [
							{
								Key: `${storageContext}/${fileName}`
							}
						],
						Quiet: true
					}
				};
				return promisify(awsObject.s3.deleteObjects, awsObject.s3)(params);
			});
	}

	generateSignedUrl(userId, storageContext, fileName, fileType, action) {
		if (!userId || !storageContext || !fileName || !action || (action == 'putObject' && !fileType)) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext)
			.then(res => {
			return UserModel.findById(userId).exec().then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

				const awsObject = createAWSObject(result.schoolId);
				let params = {
					Bucket: awsObject.bucket,
					Key: `${storageContext}/${fileName}`,
					Expires: 60
				};

				if(action == 'putObject') params.ContentType = fileType;

				return promisify(awsObject.s3.getSignedUrl, awsObject.s3)(action, params)
					.then(res => Promise.resolve({
						url: res,
						header: {
							"Content-Type": fileType,
							"x-amz-meta-path": storageContext,
							"x-amz-meta-name": fileName,
							"x-amz-meta-thumbnail": "https://schulcloud.org/images/login-right.png"
						}
					}));
			});
		});
	}

	createDirectory(userId, storageContext, dirName) {
		if (!userId || !storageContext || !dirName) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext)
			.then(res => {
				return UserModel.findById(userId).exec().then(result => {
					if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

					const awsObject = createAWSObject(result.schoolId);
					const dirPath = `${storageContext}/${dirName}`;
					var fileStream = fs.createReadStream(path.join(__dirname, '..', 'resources', '.scfake'));
					let params = {
						Bucket: awsObject.bucket,
						Key: `${dirPath}/.scfake`,
						Body: fileStream,
						Metadata: {
							path: dirPath,
							name: '.scfake'
						}
					};

					return promisify(awsObject.s3.putObject, awsObject.s3)(params);
				});
			});
	}

	deleteDirectory(userId, storageContext, directoryPrefix) {
		if (!userId || !storageContext || !directoryPrefix) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext)
			.then(res => UserModel.findById(userId).exec())
			.then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));
				const awsObject = createAWSObject(result.schoolId);
				const s3 = awsObject.s3;
				const params = {
					Bucket: awsObject.bucket,
					Prefix: directoryPrefix
				};
				return this._deleteAllInDirectory(s3, params);
			});
	}

	_deleteAllInDirectory(s3, params) {
		return promisify(s3.listObjects, s3)(params)
			.then(data => {
				if (data.Contents.length == 0) return Promise.resolve();

				const deleteParams = {Bucket: params.Bucket, Delete: {}};
				deleteParams.Delete.Objects = data.Contents;

				return promisify(s3.deleteObjects, s3)(deleteParams);
			})
			.then(deletionData => {
				if (deletionData.Deleted.length == 1000) return this._deleteAllInDirectory(s3, params);	// AWS S3 returns only 1000 items at once
				else return Promise.resolve();
			});
	}
}

module.exports = AWSS3Strategy;
