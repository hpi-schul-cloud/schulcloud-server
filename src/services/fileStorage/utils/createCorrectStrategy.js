const { BadRequest } = require('../../../errors');

const AWSStrategy = require('../strategies/awsS3');

const strategies = {
	awsS3: AWSStrategy,
};

const createCorrectStrategy = (fileStorageType) => {
	const Strategy = strategies[fileStorageType];
	if (!Strategy) throw new BadRequest('No file storage provided for this school');
	return new Strategy();
};

module.exports = createCorrectStrategy;
