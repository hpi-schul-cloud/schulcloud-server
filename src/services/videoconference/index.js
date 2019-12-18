const {
	BadRequest,
	Forbidden,
	GeneralError,
	NotFound,
	NotImplemented,
} = require('@feathersjs/errors');
const { FEATURE_VIDEOCONFERENCE_ENABLED } = require('../../../config/globals');

const { info, error, warning } = require('../../logger');
const videoconferenceHooks = require('./hooks');


class VideoconferenceService {
	constructor() {
		this.docs = {};
	}

	create(data, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden();
		}
		return new NotImplemented();
	}

	get(id, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden();
		}
		
	}

	remove(id, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden();
		}
		return new NotImplemented();
	}
}


module.exports = function setup(app) {
	app.use('/videoconference', new VideoconferenceService());
	const videoconferenceService = app.service('/videoconference');
	videoconferenceService.hooks(videoconferenceHooks);
};
