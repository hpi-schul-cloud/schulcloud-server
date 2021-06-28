const urlContainsVersion = (url) => url.search(/\/v\d\//) > -1;

const urlContainsApi = (url) => url.search(/^\/api/i) > -1;

const urlRemoveApi = (url) => url.replace(/^\/api/i, '');

module.exports = (req, res, next) => {
	if (urlContainsApi(req.url)) {
		const url = urlRemoveApi(req.url);
		if (!urlContainsVersion(url)) {
			req.url = `/legacy/v1${url}`;
			req.originalUrl = req.url;
			req.app.handle(req, res, next);
		} else {
			req.url = url;
			req.originalUrl = req.url;
			req.app.handle(req, res, next);
		}
	} else if (!urlContainsVersion(req.url)) {
		req.url = `/legacy/v1${req.url}`;
		req.originalUrl = req.url;
		req.app.handle(req, res, next);
	} else {
		next();
	}
};
