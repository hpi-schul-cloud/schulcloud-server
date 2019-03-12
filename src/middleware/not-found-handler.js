const errors = require('feathers-errors');

module.exports = function setup() {
	return function notFoundHandler(req, res, next) {
		next(new errors.NotFound('Page not found'));
	};
};
