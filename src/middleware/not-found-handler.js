const { PageNotFound } = require('../errors');

module.exports = (req, res, next) => next(new PageNotFound());
