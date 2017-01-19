const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const SchoolModel = require('../../school/model');
const aws = require('aws-sdk');

const AbstractFileStorageStrategy = require('./interface.js');

class AWSS3Strategy extends AbstractFileStorageStrategy {

	create(schoolId) {
		if (!schoolId) return Promise.reject(new errors.BadRequest('No school id'));

		// check if school already has a bucket
		return SchoolModel.findById(schoolId).then((result, err) => {
			console.log(err);
			if (!result) return Promise.reject(new errors.NotFound('school not found'));
			if (result.s3Bucket) return Promise.resolve({message: "School already has a s3-bucket.", data: result});

			let bucketName = `bucket-${schoolId}`;

			 // todo: config to secret file
		 	var config = new aws.Config({
				s3ForcePathStyle: true,
				accessKeyId: "schulcloud",
				secretAccessKey: "schulcloud",
				region: "eu-west-1",
				endpoint: new aws.Endpoint("http://service.langl.eu:3000")
			});

			 var s3 = new aws.S3(config);

			 return new Promise((resolve,reject) => {
				s3.createBucket({ Bucket: bucketName }, function(err, res) {
					if (err) {
						reject(err);
					} else {
						SchoolModel.findOneAndUpdate({_id: schoolId}, {s3Bucket: bucketName}, {new: true}, (err, res) => {
							if (err) reject(err);
							resolve({message: "Successfully created s3-bucket!", data: res});
						});
					}
				});
			});
		});
	}

	getFiles() {
		return Promise.resolve("Ok");
	}
}

module.exports = AWSS3Strategy;
