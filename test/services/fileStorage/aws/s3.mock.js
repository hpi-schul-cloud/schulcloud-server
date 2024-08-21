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

const existedBuckets = [];

const mockAws = {
	// eslint-disable-next-line object-shorthand
	S3: function s3() {
		return {
			createBucket(params) {
				let response;
				if (existedBuckets.indexOf(params.Bucket) >= 0) {
					response = {
						statusCode: 409,
						ErrorCode: 'BucketAlreadyExists',
						message:
							'The requested bucket name is not available. The bucket namespace is shared by all users of the system. Select a different name and try again.',
					};
					return Promise.reject(response);
				}

				existedBuckets.push(params.Bucket);
				response = 'successfully created bucket';
				return Promise.resolve(response);
			},
			putBucketCors(params) {
				const response = 'successfully inserted cors';
				return Promise.resolve(response);
			},
			listBuckets() {
				const bucketNames = existedBuckets.map((b) => ({ Name: b }));
				const response = { Buckets: bucketNames };
				return Promise.resolve(response);
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
			headBucket(params) {
				let response;
				if (existedBuckets.indexOf(params.Bucket) >= 0) {
					response = {
						statusCode: 200,
					};
					return Promise.resolve(response);
				} else {
					response = {
						statusCode: 404,
						ErrorCode: 'NoSuchBucket',
						message: 'The specified bucket does not exist.',
					};
					return Promise.reject(response);
				}
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
