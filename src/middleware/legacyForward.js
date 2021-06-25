const urlContainsVersion = (url) => {
	return url.search(/\/v\d\//) > -1;
};

const urlContainsApi = (url) => {
	return url.search(/^\/api/i) > -1;
};

const urlRemoveApi = (url) => {
    return url.replace(/^\/api/i, "");
}

module.exports = (req, res, next) => {
    if (urlContainsApi(url)) {
        url = urlApiReomover(req.url);
        if (!urlContainsVersion(url)) {
            req.url = `/legacy/v1${url}`;
            req.originalUrl = req.url;
            req.app.handle(req, res, next);
        } else {
            req.url = url;
            req.originalUrl = req.url;
            req.app.handle(req, res, next);
        }
    }
    else {
        if (!urlContainsVersion(url)) {
            req.url = `/legacy/v1${url}`;
            req.originalUrl = req.url;
            req.app.handle(req, res, next);
        } else {
            next();
        }
    }
};
