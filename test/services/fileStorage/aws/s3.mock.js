const testListObjectsReturn = {
	Contents: [
		{key: "testFile"}
	]
};

const testHeadObjectReturn = {
	Metadata: { name: "testName", thumbnail: "testThumbnail" },
	LastModified: "test",
	ContentLength: 5,
	ContentType: "mime/image"
};

var mockAws = {
	S3: function(){
		return {
			createBucket: function(params, callback){
				callback(null, "test");
			},
			listObjectsV2: function (params, callback) {
				callback(null, testListObjectsReturn);
			},
			getSignedUrl: function (params, callback) {
				callback(null, "test");
			},
			headObject: function (params, callback) {
				callback(null, testHeadObjectReturn);
			},
			deleteFile: function (params, callback) {
				callback(null, "test");
			}
		};
	},
	Config: function () {
		return {};
	},
	Endpoint: function () {
		return {};
	}
};

module.exports = mockAws;
