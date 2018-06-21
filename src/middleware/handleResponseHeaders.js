'use strict';

/**
 * this helper handles response headers piped through services/hooks
 */
module.exports = (req, res, next) => {

  (res.data.headerPipes || []).forEach(h => {
    if (h.key) res.header(h.key, h.value);
  });

  delete res.data.headerPipes;

  next();
};
