'use strict';

module.exports = (req, res, next) => {
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  req.headers['accept'] = req.headers['accept'] || 'application/json';
  next();
};
