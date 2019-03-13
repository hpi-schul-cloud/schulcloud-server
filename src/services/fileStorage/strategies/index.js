

const errors = require('feathers-errors');
const AWSStrategy = require('./awsS3');

const strategies = {
	awsS3: AWSStrategy,
};

const createStrategy = (fileStorageType) => {
	const Strategy = strategies[fileStorageType];
	if (!Strategy) throw new errors.BadRequest('No file storage provided');
	return new Strategy();
};

module.exports = {
	createStrategy,
};
