const {
	BadRequest,
	Forbidden,
	NotFound,
	GeneralError,
	NotImplemented,
	FeathersError,
} = require('@feathersjs/errors');
const { FEATURE_VIDEOCONFERENCE_ENABLED } = require('../../../config/globals');

const { error } = require('../../logger');
const videoconferenceHooks = require('./hooks');

const { ScopePermissionService } = require('../helpers/scopePermissions');
const { getUser } = require('../../hooks');

const { joinMeeting, getMeetingInfo } = require('./logic');
const { isNullOrEmpty } = require('./logic/utils');
const server = require('./logic/server');
const { ROLES, PERMISSIONS, SCOPE_NAMES } = require('./logic/constants');


const { ObjectId } = require('../../helper/compare');


class VideoconferenceService {
	constructor(app) {
		this.app = app;
		this.docs = {};
	}

	/**
	 * creates an url to join a meeting, inside a scope defined in
	 * id and scopeName depending on permissions as moderator or attendee.
	 * @param {scopeName, id} data
	 * @param {*} params
	 * @returns {url} to authenticate through browser redirect
	 */
	async create(data, params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			throw new Forbidden('FEATURE_VIDEOCONFERENCE_ENABLED disabled');
		}
		if (!this.valid(data)) {
			throw new BadRequest('id or scope invalid');
		}
		const { app } = this;
		const { scopeName, id: scopeId } = data;
		try {
			const user = await getUser({ params, app });
			let scopePermissionService;
			let role;
			let roomName;
			// retrieve scope information
			switch (scopeName) {
				case (SCOPE_NAMES.COURSE):
					// fetch course metadata
					// eslint-disable-next-line prefer-destructuring
					roomName = (await app.service('courses').get(scopeId)).name;
					scopePermissionService = app.service('/courses/:scopeId/userPermissions');
					break;
				default:
					throw new NotImplemented('currently videoconferences are supported for courses only');
			}

			// check permissions and set role
			const { [user.id]: permissions } = await scopePermissionService.find({
				route: { scopeId },
				query: { userId: user.id },
			});
			if (permissions.includes(PERMISSIONS.MODERATE_MEETING)) {
				role = ROLES.MODERATOR;
			} else if (permissions.includes(PERMISSIONS.ATTEND_MEETING)) {
				role = ROLES.ATTENDEE;
			} else {
				throw new Forbidden('huhu');
			}

			const url = await joinMeeting(
				server,
				roomName,
				scopeId,
				user.fullName,
				role,
				{ userID: user.id },
			);
			return { url };
		} catch (err) {
			if (err instanceof FeathersError) {
				throw err;
			}
			throw new GeneralError(
				'join meeting link generation failed',
			);
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
			&& Object.values(SCOPE_NAMES).includes(params.scopeName);
	}
}


module.exports = function setup(app) {
	app.use('/videoconference', new VideoconferenceService(app));
	const videoconferenceService = app.service('/videoconference');
	videoconferenceService.hooks(videoconferenceHooks);
};
