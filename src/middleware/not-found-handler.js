const { PageNotFound } = require('../errors');
// todo do not work well with error handling, it is produce a 404 and pass it 500er Internal Error
module.exports = (req, res, next) =>
	// next(new PageNotFound()); enabling would disable NestJS we handle this inside of the NestJS app
	next();
