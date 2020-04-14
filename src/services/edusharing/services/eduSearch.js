const { Configuration } = require('@schul-cloud/commons');
const hooks = require('../hooks');
const EduSharingConnector = require('../logic/connector');
const logger = require('../../../logger');

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
	if (Configuration.get('FEATURE_EDUSHARING_ENABLED') === true) {
		const eduRoute = '/edu-sharing';
		app.use(eduRoute, new EduSearch(), (req, res) => {
			res.send(res.data);
		});
		const eduService = app.service(eduRoute);
		eduService.hooks(hooks);
	} else {
		logger.debug('Feature edusharing is not enabled');
	}
};
