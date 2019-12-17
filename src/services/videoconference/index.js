const bbb = require('bbb-promise');

const {
	BadRequest,
	Forbidden,
	GeneralError,
	NotFound,
	NotImplemented,
} = require('@feathersjs/errors');
const { info, error, warning } = require('../../logger');
const videoconferenceHooks = require('./hooks');

const { FEATURE_VIDEOCONFERENCE_ENABLED, SERVICES } = require('../../../config/globals').SERVICES.VIDEOCONFERENCE;
const { URL, SALT } = SERVICES.VIDEOCONFERENCE;

const server = bbb.server(, 'some_secret');

class VideoconferenceService {
	constructor() {
		this.docs = {};
	}

	create(data, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden();
		}

	}

	get(id, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden();
		}
		return new NotImplemented();
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
