const { NotFound } = require('@feathersjs/errors');
// todo do not work well with error handling, it is produce a 404 and pass it
module.exports = (req, res, next) => {
	next(new NotFound('Page not found'));
};
