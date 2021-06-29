const urlContainsApi = (url) => url.search(/^\/api/i) > -1;

const urlRemoveApi = (url) => url.replace(/^\/api/i, '');

const apiPath = (req, res, next) => {
	if (urlContainsApi(req.url)) {
		req.url = urlRemoveApi(req.url);
		req.originalUrl = req.url;
		req.app.handle(req, res, next);
	} else {
		next();
	}
};

module.exports = (app) => {
	app.use(apiPath);
}