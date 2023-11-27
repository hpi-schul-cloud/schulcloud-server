/**
 * this helper handles response type (e.g. file download)
 */
module.exports = function restFormatter(req, res, next) {
	res.format({
		'application/json': function () {
			res.send(res.data);
		},
		'text/plain': function () {
			res.send(res.data);
		},
		'text/html': () => res.send(res.data),
	});
};
