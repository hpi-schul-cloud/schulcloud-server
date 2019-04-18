'use strict';

const errors = require('@feathersjs/errors');

module.exports = function () {
	return function (req, res, next) {
		next(new errors.NotFound('Page not found'));
	};
};
