const hooks = require('../hooks');
const EduSharingConnector = require('../logic/connector');
const logger = require('../../../logger');

class EduSearch {
	find(data) {
		return EduSharingConnector.GET(data);
	}

	get(id, params) {
		return EduSharingConnector.GETONE(id, params);
	}
}

module.exports = (app) => {
	if (app.Config.get('FEATURE_EDUSHARING_ENABLED') === true) {
		const eduRoute = '/edu-sharing';
		app.use(eduRoute, new EduSearch(), (req, res) => {
			res.send(res.data);
		});
		const eduService = app.service('/edu-sharing');
		eduService.hooks(hooks);
	} else {
		logger.debug('Feature edusharing is not enabled');
	}
};
