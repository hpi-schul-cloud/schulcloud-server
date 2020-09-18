const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const EduSharingConnector = require('./logic/connector');

class EduSearch {
	find(data) {
		return EduSharingConnector.FIND(data);
	}

	get(id, params) {
		return EduSharingConnector.GET(id, params);
	}
}

module.exports = (app) => {
	const eduRoute = '/edu-sharing';
	app.use(eduRoute, new EduSearch(), (req, res) => {
		res.send(res.data);
	});
	const eduService = app.service(eduRoute);
	eduService.hooks(hooks);

	app.use(`${eduRoute}/api`, staticContent(path.join(__dirname, '/docs')));
};
