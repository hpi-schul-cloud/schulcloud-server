const urlContainsVersion = (url) => {
	return url.search(/\/v\d\//) > -1;
};
module.exports = (req, res, next) => {
	if (!urlContainsVersion(req.url)) {
		req.url = `/legacy/v1${req.url}`;
		req.originalUrl = req.url;
		req.app.handle(req, res, next);
	} else {
		next();
	}
};
