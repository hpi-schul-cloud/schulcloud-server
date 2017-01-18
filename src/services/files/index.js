'use strict';
const uploadService = require('./service');
const aws = require('aws-sdk');
const hooks = require('./hooks');

class Service {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		return Promise.resolve(data);
	}

	get(id, params) {
		return Promise.resolve({
			id, text: `A new message with ID: ${id}!`
		});
	}

	create(data, params) {
		var config = new aws.Config({
			accessKeyId: "1234",
			secretAccessKey: "1234",
			region: "eu-west-1",
			endpoint: new aws.Endpoint("http://service.langl.eu:3000")
		});

		var s3 = new aws.S3(config);

		var params = {
			Bucket: 'Bucket',
			Key: params.filename,
			Expires: 60,
			ContentType: params.filetype
		};

		return new Promise((resolve,reject)=>{
			s3.createBucket({ Bucket: "Absbucket" }, function(err, data) {
				if (err) {
					console.log("Error", err);
					reject(err);
				} else {
					console.log("Success", data.Location);
					resolve(data);
				}
			});
		})

	}

	update(id, data, params) {
		return Promise.resolve(data);
	}

	patch(id, data, params) {
		return Promise.resolve(data);
	}

	remove(id, params) {
		return Promise.resolve({ id });
	}
}

module.exports = function(){
  const app = this;

  // Initialize our service with any options it requires
  app.use('/files', new Service());
  app.use('/files/upload', new uploadService());

  // Get our initialize service to that we can bind hooks
  const filesService = app.service('/files');

  // Set up our before hooks
  filesService.before(hooks.before);

  // Set up our after hooks
  filesService.after(hooks.after);
};

module.exports.Service = Service;
