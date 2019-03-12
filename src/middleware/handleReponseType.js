
/**
 * this helper handles response type (e.g. file download)
 */
module.exports = function restFormatter(req, res, next) {
	res.format({
		'application/json': () => {
			res.send(res.data);
		},
		'text/plain': () => {
			res.send(res.data);
		},
	});
};
