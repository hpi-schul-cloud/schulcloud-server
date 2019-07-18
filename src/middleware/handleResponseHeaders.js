/**
 * this helper handles response headers piped through services/hooks
 */
module.exports = (req, res, next) => {
	if (res.data) {
		(res.data.headerPipes || []).forEach((h) => {
			if (h.key) res.header(h.key, h.value);
		});
		delete res.data.headerPipes;
	}

	// wopi doesn't have a 201 statusCode which would cause problems
	if (res.statusCode === 201) {
		res.statusCode = 200;
	}

	next();
};
