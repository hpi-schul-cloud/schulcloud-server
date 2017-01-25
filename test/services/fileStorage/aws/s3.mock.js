var mockAws = {
	S3: function(){
		return {
			createBucket: function(params, callback){
				callback(null, "test");
			},
			listObjectsV2: function (params, callback) {
				callback(null, "test");
			},
			getSignedUrl: function (params, callback) {
				callback(null, "test");
			},
			headObject: function (params, callback) {
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
