const { Configuration } = require('@schul-cloud/commons');
const hooks = require('./hooks');
const EduSharingConnector = require('./logic/connector');

class EduSearch {
	find(data) {
		// todo filter response properties
		return EduSharingConnector.FIND(data);
	}

	get(id, params) {
		return EduSharingConnector.GET(id, params);
	}
}

module.exports = (app) => {
	if (Configuration.get('LERNSTORE_MODE') === 'EDUSHARING') {
		const eduRoute = '/edu-sharing';
		app.use(eduRoute, new EduSearch(), (req, res) => {
			res.send(res.data);
		});
		const eduService = app.service(eduRoute);
		eduService.hooks(hooks);
	}
};
