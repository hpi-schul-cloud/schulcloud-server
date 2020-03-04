const hooks = require('../hooks');
const EduSharingConnector = require('../logic/connector');
const logger = require('../../../logger');

class EduSearch {
	find(data) {
		return EduSharingConnector.GET(data);
	}
}

module.exports = (app) => {
	console.log('hello');
	if (app.Config.get('FEATURE_EDUSHARING_ENABLED') === true) {
		const eduRoute = '/edu-sharing';
		app.use(eduRoute, new EduSearch(), (req, res) => {
			res.send(res.data);
		});
		const eduService = app.service('/edu-sharing');
		eduService.hooks(hooks);
	} else {
		console.error('oops');
		logger.debug('Feature edusharing is not enabled');
	}
};
