const hooks = require('./hooks');
const EduSharingConnector = require('./logic/connector');

class EduSearch {
	find(req) {
		return EduSharingConnector.FIND(req);
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
};
