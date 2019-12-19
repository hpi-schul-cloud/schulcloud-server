const {
	BadRequest,
	Forbidden,
	NotFound,
} = require('@feathersjs/errors');
const { FEATURE_VIDEOCONFERENCE_ENABLED } = require('../../../config/globals');

const { error } = require('../../logger');
const videoconferenceHooks = require('./hooks');

const { ScopePermissionService } = require('../helpers/scopePermissions');
const { getUser } = require('../../hooks');

const { joinMeeting, getMeetingInfo } = require('./logic');
const { isNullOrEmpty } = require('./logic/utils');
const server = require('./logic/server');
const { ROLES, PERMISSIONS } = require('./logic/constants');

const scopeNames = ['team', 'event'];

const { ObjectId } = require('../../helper/compare');


class VideoconferenceService {
	constructor(app) {
		this.app = app;
		this.docs = {};
	}

	async create(data, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden('feature disabled');
		}
		if (isNullOrEmpty(data.scopeName) || !scopeNames.includes(data.scopeName)
			|| isNullOrEmpty(data.id) || !ObjectId.isValid(data.id)) {
			return new BadRequest('id or scope invalid');
		}
		try {
			// TODO check user permissions in given scope & moderator role option
			// check scope is valid
			const permissions = [PERMISSIONS.CREATE_MEETING]; // await ScopePermissionService.87(params.account.userId, data.id);
			// if (!permissions.includes(PERMISSIONS.CREATE_MEETING) || !permissions.includes(PERMISSIONS.JOIN_MEETING)) {
			// 	return new Forbidden();
			// }
			const role = permissions.includes(PERMISSIONS.CREATE_MEETING) ? ROLES.MODERATOR : ROLES.ATTENDEE;
			const name = 'scopemeetingname';
			const { app } = this;
			const user = await getUser({ params, app });
			const url = await joinMeeting(server, name, data.id, user.fullName, role);
			// TODO secure authentication for one-time-use only
			return {
				success: true,
				url,
			};
		} catch (err) {
			error(err);
			return {
				success: false,
			};
		}
	}

	find(params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			return new Forbidden('feature disabled');
		}
		if (!ObjectId.isValid(params.id)
			|| isNullOrEmpty(params.scopeName)
			|| !scopeNames.includes(params.scopeName)) {
			return new BadRequest('id or scope name invalid');
		}
		try {
			// TODO check user permissions in given scope, request scope type in params
			// check scope is valid
			const meeting = getMeetingInfo(server, params.id);
			if (meeting === false) {
				return new NotFound();
			}
			return {
				success: true,
				meeting,
			};
		} catch (e) {
			error(e);
			return {
				success: false,
			};
		}
	}
}


module.exports = function setup(app) {
	app.use('/videoconference', new VideoconferenceService(app));
	const videoconferenceService = app.service('/videoconference');
	videoconferenceService.hooks(videoconferenceHooks);
};
