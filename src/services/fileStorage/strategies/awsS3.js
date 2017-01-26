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
	if (values.length != 2) return Promise.reject(new errors.BadRequest("StorageContext is invalid"));
	var context = values[0];
	switch (context) {
		case 'users':
			return UserModel.findById(values[1]).exec().then(res => {
				if (!res || res._id != userId.toString()) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return res;
			});
		case 'courses':
			return CourseModel.find({$and: [{userIds: userId}, {_id: values[1]}]}).exec().then(res => {
				if (!res || res.length <= 0) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return res;
			});
		case 'classes':
			return ClassModel.find({$and: [{userIds: userId}, {_id: values[1]}]}).exec().then(res => {
				if (!res || res.length <= 0) {
					return Promise.reject(new errors.Forbidden("You don't have permissions!"));
				}
				return res;
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
	return Promise.all(awsObjects.map((object) => {
		return new Promise((resolve, reject) => {
			s3.headObject({Bucket: bucketName, Key: object.Key}, function (err, res) {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}))
		.then((array) => {
			return array.map(object => {
				return {
					name: object.Metadata.name,
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
		if (!schoolId) return Promise.reject(new errors.BadRequest('No school id'));

		// check if school already has a bucket
		var promise = SchoolModel.findById(schoolId).exec();

		return promise.then((result) => {
			if (!result) return Promise.reject(new errors.NotFound('school not found'));

			var awsObject = createAWSObject(result._id);

			return new Promise((resolve, reject) => {
				awsObject.s3.createBucket({Bucket: awsObject.bucket}, function (err, res) {
					if (err) {
						reject(err);
					} else {
						resolve({message: "Successfully created s3-bucket!", data: res});
					}
				});
			});
		}).catch(err => {
			return Promise.reject(err);
		});
	}

	getFiles(userId, storageContext) {
		if (!userId || !storageContext) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext).then(res => {
			return UserModel.findById(userId).exec().then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

				var awsObject = createAWSObject(result.schoolId);

				return new Promise((resolve, reject) => {
					awsObject.s3.listObjectsV2({Bucket: awsObject.bucket, Prefix: storageContext}, function (err, res) {
						if (err) {
							reject(err);
						} else {
							resolve(getFileMetadata(res.Contents, awsObject.bucket, awsObject.s3));
						}
					});
				});
			}).catch(err => {
				return err;
			});
		}).catch(err => {
			return err;
		});
	}

	generateSignedUrl(userId, storageContext, fileName, fileType, action) {
		if (!userId || !storageContext || !fileName || !action || (action == 'putObject' && !fileType)) return Promise.reject(new errors.BadRequest('Missing parameters'));
		return verifyStorageContext(userId, storageContext).then(res => {
			return UserModel.findById(userId).exec().then(result => {
				if (!result || !result.schoolId) return Promise.reject(errors.NotFound("User not found"));

				var awsObject = createAWSObject(result.schoolId);
				var params = {
					Bucket: awsObject.bucket,
					Key: storageContext + '/' + fileName,
					Expires: 60
				};

				if(action == 'putObject') params.ContentType = fileType;

				return new Promise((resolve, reject) => {
					awsObject.s3.getSignedUrl(action, params, function (err, res) {
						if (err) {
							reject(err);
						} else {
							resolve({
								url: res,
								header: {
									"Content-Type": fileType,
									"x-amz-meta-name": fileName,
									"x-amz-meta-thumbnail": "https://schulcloud.org/images/login-right.png"
								}
							});
						}
					});
				});
			}).catch(err => {
				return err;
			});
		}).catch(err => {
			return err;
		});
	}
}

module.exports = AWSS3Strategy;
