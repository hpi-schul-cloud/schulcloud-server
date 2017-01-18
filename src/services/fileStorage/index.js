'use strict';
const uploadService = require('./service');
const aws = require('aws-sdk');
const hooks = require('./hooks');
var schoolService;
class Service {
	constructor(app) {
		schoolService = app.service("schools");
	}
	
	/**
	 * todo: swagger
	 * @param data, contains bucketName, schoolId
	 * @param params
	 * @returns {Promise}
     */
	create(data, params) {
		if (!data.bucketName || !data.schoolId) return Promise.reject("Bad request");

		// todo: config to secret file
		var config = new aws.Config({
			accessKeyId: "1234",
			secretAccessKey: "1234",
			region: "eu-west-1",
			endpoint: new aws.Endpoint("http://service.langl.eu:3000")
		});

		var s3 = new aws.S3(config);

		return new Promise((resolve,reject) => {
			s3.createBucket({ Bucket: data.bucketName }, function(err, res) {
				if (err) {
					reject(err);
				} else {
					schoolService.patch(data.schoolId, {s3Bucket: data.bucketName})
						.then(res => {
						resolve(res);
					}).catch(err => {
						reject(err);
					});
				}
			});
		});
	}
}

module.exports = function(){
  const app = this;

  // Initialize our service with any options it requires
  app.use('/fileStorage', new Service(app));
	// todo: upload to client!
  //app.use('/files/upload', new uploadService());

  // Get our initialize service to that we can bind hooks
  const filesService = app.service('/fileStorage');

  // Set up our before hooks
  filesService.before(hooks.before);

  // Set up our after hooks
  filesService.after(hooks.after);
};

module.exports.Service = Service;
