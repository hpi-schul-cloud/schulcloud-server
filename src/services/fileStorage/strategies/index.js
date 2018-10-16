'use strict';

const AWSStrategy = require('./awsS3');
const errors = require('feathers-errors');

const strategies = {
	'awsS3': AWSStrategy
};

const createStrategy = (fileStorageType) => {
	const strategy = strategies[fileStorageType];
	if (!strategy) throw new errors.BadRequest("No file storage provided");
	return new strategy();
};

module.exports = {
    createStrategy
};
