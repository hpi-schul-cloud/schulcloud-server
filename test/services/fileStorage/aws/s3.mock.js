const testListObjectsReturn = {
	Contents: [{ Key: 'testFile' }, { Key: '.scfake' }],
};

const testHeadObjectReturn = {
	Metadata: { name: 'testName', thumbnail: 'testThumbnail' },
	LastModified: 'test',
	ContentLength: 5,
	ContentType: 'mime/image',
	Key: 'testKey',
};

const mockAws = {
	// eslint-disable-next-line object-shorthand
	S3: function s3() {
		return {
			createBucket(params, callback) {
				callback(null, 'successfully created bucket');
			},
			putBucketCors(params) {
				return 'successfully inserted cors';
			},
			listObjectsV2(params, callback) {
				callback(null, testListObjectsReturn);
			},
			getSignedUrl(action, params, callback) {
				callback(null, 'successfully created signed url');
			},
			headObject(params, callback) {
				callback(null, testHeadObjectReturn);
			},
			deleteObjects(params, callback) {
				callback(null, { Deleted: params.Delete.Objects });
			},
			putObject(params, callback) {
				callback(null, 'successfully put object');
			},
			headBucket(params, callback) {
				callback(null);
			},
		};
	},
	// eslint-disable-next-line object-shorthand
	Config: function config() {
		return {};
	},
	// eslint-disable-next-line object-shorthand
	Endpoint: function endpoint() {
		return {};
	},
};

module.exports = mockAws;
