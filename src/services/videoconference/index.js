const {
	BadRequest,
	Forbidden,
	NotFound,
	GeneralError,
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

	/**
	 * creates an url to join a meeting
	 * @param {*} data
	 * @param {*} params
	 */
	async create(data, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			throw new Forbidden('FEATURE_VIDEOCONFERENCE_ENABLED disabled');
		}
		if (!this.valid(data)) {
			throw new BadRequest('id or scope invalid');
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
			return { url };
		} catch (err) {
			throw new GeneralError('join meeting link generation failed', err);
		}
	}

	/**
	 * fetches details about an existing meeting
	 * @param {*} params
	 */
	find(params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			throw new Forbidden('FEATURE_VIDEOCONFERENCE_ENABLED disabled');
		}
		if (this.valid(params)) {
			throw new BadRequest('id or scope name invalid');
		}
		try {
			// TODO check user permissions in given scope, request scope type in params
			// check scope is valid
			const meeting = getMeetingInfo(server, params.id);
			if (meeting === false) {
				return new NotFound();
			}
			return { meeting };
		} catch (err) {
			throw new GeneralError('requesting meeting info failed', err);
		}
	}

	valid(params) {
		return ObjectId.isValid(params.id)
			&& !isNullOrEmpty(params.scopeName)
			&& scopeNames.includes(params.scopeName);
	}
}


module.exports = function setup(app) {
	app.use('/videoconference', new VideoconferenceService(app));
	const videoconferenceService = app.service('/videoconference');
	videoconferenceService.hooks(videoconferenceHooks);
};
