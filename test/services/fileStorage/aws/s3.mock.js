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
				callback(null, "successfully created bucket");
			},
			listObjectsV2: function (params, callback) {
				callback(null, testListObjectsReturn);
			},
			getSignedUrl: function (action, params, callback) {
				callback(null, "successfully created signed url");
			},
			headObject: function (params, callback) {
				callback(null, testHeadObjectReturn);
			},
			deleteObjects: function(params, callback) {
				callback(null, "successfully deleted object");
			},
			putObject: function (params, callback) {
				callback(null, "successfully put object");
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
