const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const SchoolModel = require('../../school/model');
const UserModel = require('../../user/model');
const CourseModel = require('../../user-group/model').courseModel;
const ClassModel = require('../../user-group/model').classModel;
const aws = require('aws-sdk');
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
			return CourseModel.find({$and: [{userIds: userId}, {_id: values[1]}]}).exec().then(res => {
				if (!res || res.length <= 0) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return Promise.resolve(res);
			});
		case 'classes':
			return ClassModel.find({$and: [{userIds: userId}, {_id: values[1]}]}).exec().then(res => {
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

const getFileMetadata = (awsObjects, bucketName, s3) => {
	const headObject = promisify(s3.headObject, s3);
	const _getPath = (path) => {
		if (!path) {
			return "/";
		}

		// remove first and second directory from storageContext because it's just meta
		return `/${path.split("/").filter((v, index) => index > 1).join("/")}`;
	};

	return Promise.all(awsObjects.map((object) => headObject({Bucket: bucketName, Key: object.Key})))
		.then((array) => {
			return array.map(object => {
				return {
					name: object.Metadata.name,
					path: _getPath(object.Metadata.path),
					lastModified: object.LastModified,
					size: object.ContentLength,
					type: object.ContentType,
					thumbnail: object.Metadata.thumbnail
				};
			});
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
				return promisify(awsObject.s3.listObjectsV2, awsObject.s3)({Bucket: awsObject.bucket, Prefix: storageContext})
					.then(res => Promise.resolve(getFileMetadata(res.Contents, awsObject.bucket, awsObject.s3)));
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
}

module.exports = AWSS3Strategy;
