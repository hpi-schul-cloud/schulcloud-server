const request = require('request-promise-native');
const hooks = require('../hooks');
const EduSharingConnector = require('../logic/connector');

class EduSearch {
	find(data) {
		return EduSharingConnector.GET(data);
	}
}

module.exports = (app) => {
	const eduRoute = '/edusharing/search';
	app.use(eduRoute, new EduSearch());
	const eduService = app.service('/edusharing/search');
	eduService.hooks(hooks);
};
