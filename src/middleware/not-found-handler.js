const { Configuration } = require('@hpi-schul-cloud/commons');
const { PageNotFound } = require('../errors');

module.exports = (req, res, next) => {
	if (Configuration.get('FEATURE_LEGACY_NOT_FOUND_ENABLED') === true) return next(new PageNotFound());
	return next();
};
