/**const aws = require('aws-sdk');
const fs = require('fs');

class Service {
	constructor(options) {
		this.options = options || {};
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
			Key: data.filename,
			Expires: 60,
			ContentType: data.filetype,
			Body: fs.createReadStream('./image.png')
		};
		console.log(data);

		return new Promise((resolve,reject)=> {
			s3.upload(params, function (err, data) {
				if (err) {
					console.log(err);
					reject(err);
				} else {
					resolve(data);
				}
			});

		})
	}
}

module.exports = Service;**/
