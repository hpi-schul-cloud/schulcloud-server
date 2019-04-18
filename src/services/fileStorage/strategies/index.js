const errors = require('@feathersjs/errors');
const AWSStrategy = require('./awsS3');

const strategies = {
	awsS3: AWSStrategy,
};

const createStrategy = (fileStorageType) => {
	const strategy = strategies[fileStorageType];
	if (!strategy) throw new errors.BadRequest('No file storage provided');
	return new strategy();
};

module.exports = {
	createStrategy,
};
