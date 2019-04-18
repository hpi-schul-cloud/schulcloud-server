const testListObjectsReturn = {
	Contents: [
		{ Key: 'testFile' },
		{ Key: '.scfake' },
	],
};

const testHeadObjectReturn = {
	Metadata: { name: 'testName', thumbnail: 'testThumbnail' },
	LastModified: 'test',
	ContentLength: 5,
	ContentType: 'mime/image',
	Key: 'testKey',
};

const mockAws = {
	S3: function () {
		return {
			createBucket: function (params, callback) {
				callback(null, 'successfully created bucket');
			},
			putBucketCors: function (params) {
				return 'successfully inserted cors';
			},
			listObjectsV2: function (params, callback) {
				callback(null, testListObjectsReturn);
			},
			getSignedUrl: function (action, params, callback) {
				callback(null, 'successfully created signed url');
			},
			headObject: function (params, callback) {
				callback(null, testHeadObjectReturn);
			},
			deleteObjects: function (params, callback) {
				callback(null, { Deleted: params.Delete.Objects });
			},
			putObject: function (params, callback) {
				callback(null, 'successfully put object');
			},
			headBucket: function (params, callback) {
				callback(null);
			},
		};
	},
	Config: function () {
		return {};
	},
	Endpoint: function () {
		return {};
	},
};

module.exports = mockAws;
