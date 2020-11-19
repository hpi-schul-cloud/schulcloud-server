const mockery = require('mockery');

class AWSStrategy {
	deleteFile() {
		return Promise.resolve();
	}

	generateSignedUrl() {
		return Promise.resolve('https://something.com');
	}

	getSignedUrl() {
		return Promise.resolve('https://something.com');
	}
}

const enable = () => {
	mockery.enable({
		warnOnReplace: false, // ?
		warnOnUnregistered: false,
		useCleanCache: true,
	});

	/* important mockery is match the require import strings */
	mockery.registerMock('../strategies/awsS3', AWSStrategy);
};

const disable = () => {
	mockery.deregisterAll();
	mockery.disable();
};

module.exports = {
	enable,
	disable,
};
