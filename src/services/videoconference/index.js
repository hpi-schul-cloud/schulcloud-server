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

const { getUser } = require('../../hooks');

const { joinMeeting, getMeetingInfo } = require('./logic');
const { isNullOrEmpty } = require('./logic/utils');
const server = require('./logic/server');
const {
	ROLES, PERMISSIONS, SCOPE_NAMES, RESPONSE_STATUS, STATES,
} = require('./logic/constants');

const VideoconferenceModel = require('./model');
const { schoolModel: Schools } = require('../school/model');


const { ObjectId } = require('../../helper/compare');


class VideoconferenceService {
	constructor(app) {
		this.app = app;
		this.docs = {};
	}

	/**
	 * @typedef {Object} VideoConference
	 * @property {[url:Url]} the url to join the videoconference
	 * @property {[state:STATE]} the current state in which the videoconference is in
	 * @property {success:'SUCCESS'|'ERROR'} status indicator
	 * @property {[permissions:[String]]} user permissions
	 * @property {[error:String]} error message indication string
	 */

	 /**
		*
		* @param {String} id the id of the scope
		* @param {Object} params
		* @param {String} params.query.scopeName the named identifier for given scope id
		* @returns {VideoConference}
		*/
	async get(id, params) {
		// PARAMETER VALIDATION
		const { scopeName } = params.route;
		if (!this.requestParamsValid({ id, scopeName })) {
			// todo params cleanup
			throw new BadRequest('id or scopeName invalid');
		}
		// TODO CHECK PERMISSIONS

		const responseTypes = ['wait', 'start', 'join', 'error'];
		if (!params.query.demo || !responseTypes.includes(params.query.demo)) {
			throw new BadRequest(`define demo in query with one value of${JSON.stringify(responseTypes)}`);
		}

		const createResponse = (status, state, permission, url, options) => ({
			status, state, permission, url, options,
		});

		// sample wait  response
		switch (params.query.demo) {
			case 'wait':
				return createResponse(
					RESPONSE_STATUS.SUCCESS,
					STATES.NOT_STARTED,
					PERMISSIONS.JOIN_MEETING,
				);
			case 'start':
				return createResponse(
					RESPONSE_STATUS.SUCCESS,
					STATES.READY,
					PERMISSIONS.START_MEETING,
					undefined,
					{
						moderatorMustApproveJoinRequests: false,
						everybodyJoinsAsModerator: false,
					},
				);
			case 'join':
				return createResponse(
					RESPONSE_STATUS.SUCCESS,
					STATES.STARTED,
					PERMISSIONS.JOIN_MEETING,
					'https://some.url',
				);
			default: // error
				return {
					status: RESPONSE_STATUS.ERROR,
					error: { message: 'errorMessage', key: 123 },
				};
		}
	}


	/**
 * creates an videoconference url to join a meeting, inside a scope defined by
	 * id and scopeName depending on permissions as moderator or attendee.
	 * this may fail due missing permissions
	 * @param {{scopeName:string, id:string}} data
	 * @param {Object} params
	 * @param {Boolean} [params.moderatorMustApproveJoinRequests=false] - let moderators approve everybody who jons the videoconference
	 * @param {Boolean} [params.everybodyJoinsAsModerator=false] - let everybody join the videoconference as moderator
	 * @param {[String]} [params.rolesAllowedToAttendVideoconference=false] - scope roles who may attend the videoconference
	 * @param {[String]} [params.rolesAllowedToStartVideoconference=false] - scope role who may start the videoconference
	 * @returns {CreateResponse} to authenticate through browser redirect
	 * @returns NotFound, if the videoconference hasn't started yet and the user is not allowed to start it
	 * @returns Forbidden, if the user is not allowed to join or create the videocoference or access this service while corerct parameters are given or the feature is disabled
	 *
	 */
	async create(data, params) {
		// PARAMETER VALIDATION
		if (!this.requestParamsValid(data)) {
			// todo params cleanup
			throw new BadRequest('id or scopeName invalid');
		}

		const { app } = this;
		const { scopeName, id: scopeId } = data;
		const authenticatedUser = await getUser({ params, app });

		// CHECK PERMISSIONS

		// throw, if feature has not been enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			throw new Forbidden('feature FEATURE_VIDEOCONFERENCE_ENABLED disabled');
		}

		// throw, if current users school feature is missing
		const schoolFeatureEnabled = await this.isSchoolFeatureEnabled(authenticatedUser.schoolId);
		if (!schoolFeatureEnabled) {
			throw new Forbidden('school feature disabled'); // todo this happen currently for experts
		}


		// todo check scope permission -> 403
		const { roomName, permissions: userPermissionsInScope } = await this
			.getScopeInfo(app, authenticatedUser, scopeName, scopeId);
		if (!this.userHasVideoconferencePermissionsInScope(userPermissionsInScope)) {
			throw new Forbidden('user permissions missing for scope');
		}

		// todo check user permission -> 403
		// todo check extended permissions for start and join

		// BUSINESS LOGIC

		// check videoconference metadata have been defined locally
		const videoconferenceSettings = await VideoconferenceModel
			.findOne({ targetModel: scopeName, target: scopeId }).lean().exec();
		if (videoconferenceSettings === null) {
			// metadata do not exist, continue only, when user allowed to create meeting
			if (!this.userIsAllowedTo(PERMISSIONS.CREATE_MEETING, userPermissionsInScope)) {
				return new NotFound(); // moderators may create it, others have to wait/reload
			}
			return new NotImplemented('create? required params?'); // todo
		}

		// from here we must have videoconferenceSettings to be defined

		// check if the videoconference is running in bbb
		const info = getMeetingInfo(server, scopeId);
		if (info === false) {
			if (!this.userIsAllowedTo(PERMISSIONS.START_MEETING, userPermissionsInScope)) {
				return new NotFound(); // moderators may start it, others have to wait/reload
			}
			try {
				const options = this.setOptions(authenticatedUser.id, videoconferenceSettings);
				// todo extend options based on metadata created before
				const role = this.getUserRole();
				const url = await joinMeeting(
					server,
					roomName,
					scopeId,
					authenticatedUser.fullName,
					role,
					options,
				);
				return { url };
			} catch (err) {
				if (err instanceof FeathersError) {
					throw err;
				}
				error(err);
				throw new GeneralError(
					'join meeting link generation failed',
				);
			}
		}

		// from here, the videoconference is currently running
	}

	/**
	 * This translates internal params for creation into options from bbb.
	 * @param {String} userId
	 * @param {Object} params
	 * @param {Boolean} [params.moderatorMustApproveJoinRequests=false] - let moderators approve everybody who jons the videoconference
	 * @param {Boolean} [params.everybodyJoinsAsModerator=false] - let everybody join the videoconference as moderator
	 * @param {[String]} [params.rolesAllowedToAttendVideoconference] - scope roles who may attend the videoconference
	 * @param {[String]} [params.rolesAllowedToStartVideoconference] - scope role who may start the videoconference
	 * @returns bbb options

	 */
	setOptions(userID, {
		moderatorMustApproveJoinRequests = false,
		everybodyJoinsAsModerator = false,
		// rolesAllowedToAttendVideoconference = [],
		// rolesAllowedToStartVideoconference = [],
	}) {
		const options = { userID };
		if (moderatorMustApproveJoinRequests) {
			// todo others are guests and guest policy may be updated
		}
		if (everybodyJoinsAsModerator) {
			// here we override the current role the user will have
		}
		return options;
	}

	/**
	 * checks if the school feature is enabled
	 * @param {String} schoolId
	 * @returns Boolean
	 */
	async isSchoolFeatureEnabled(schoolId) {
		const school = await Schools.findById(schoolId).lean().exec();
		if (school && school.features && Array.isArray(school.features) && 'videoconference' in school.features) {
			return true;
		}
		return false;
	}

	userHasVideoconferencePermissionsInScope(userPermissions) {
		const videoConferencePermissionValues = Object.values(PERMISSIONS);
		const videoConferencePermissionsOfUser = userPermissions
			.filter((permission) => videoConferencePermissionValues.includes(permission));
		return videoConferencePermissionsOfUser.length > 0;
	}

	/**
	 * Returns true, if the array of userPermissions includes the desired permission, otherwise returns false.
	 * @param {String} permission to test to be part of usersPermissions
	 * @param {[String]} usersPermissions
	 * @returns {Boolean}
	 */
	userIsAllowedTo(permission, usersPermissions) {
		return usersPermissions.includes(permission);
	}

	getUserRole() {
		// todo
		return ROLES.MODERATOR;
	}

	/**
	 *
	 * @param {Object} app Express app
	 * @param{*} user
	 * @param {*} copeName
	 * @param {* scopeId
	 */
	async getScopeInfo(app, user, scopeName, scopeId) {
		let scopePermissionService;
		let roomName;
		// retrieve scope information, set roomName AND scopePermissionService OR throw
		switch (scopeName) {
			case (SCOPE_NAMES.COURSE):
				// fetch course metadata
				// eslint-disable-next-line prefer-destructuring
				roomName = (await app.service('courses').get(scopeId)).name;
				scopePermissionService = app.service('/courses/:scopeId/userPermissions');
				break;
			default:
				throw new BadRequest('invalid scope information given');
		}

		// check permissions and set role
		const { [user.id]: permissions } = await scopePermissionService.find({
			route: { scopeId },
			query: { userId: user.id },
		});

		return { roomName, permissions };
	}

	/**
	 * fetches deils about an existing meeting
	 * @param {*} params
	 */
	find(params) {
		// check feature is enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			throw new Forbidden('FEATURE_VIDEOCONFERENCE_ENABLED disabled');
		}
		if (this.requestParamsValid(params)) {
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
			error(err);
			throw new GeneralError('requesting meeting info failed');
		}
	}

	requestParamsValid(params) {
		return ObjectId.isValid(params.id)
			&& !isNullOrEmpty(params.scopeName)
			&& Object.values(SCOPE_NAMES).includes(params.scopeName);
	}
}


module.exports = function setup(app) {
	app.use('/videoconference/:scopeName', new VideoconferenceService(app));
	const videoconferenceService = app.service('/videoconference');
	// videoconferenceService.hooks(videoconferenceHooks);
};
