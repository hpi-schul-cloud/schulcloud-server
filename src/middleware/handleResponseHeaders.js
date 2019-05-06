'use strict';

/**
 * this helper handles response headers piped through services/hooks
 */
module.exports = (req, res, next) => {
	console.log('handle response');
	(res.data.headerPipes || []).forEach(h => {
		if (h.key) res.header(h.key, h.value);
	});

	// wopi doesn't have a 201 statusCode which would cause problems
	if (res.statusCode === 201)
		res.statusCode = 200;

	delete res.data.headerPipes;

	next();
};
