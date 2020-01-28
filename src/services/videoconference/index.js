const {
	BadRequest,
	Forbidden,
	GeneralError,
	FeathersError,
} = require('@feathersjs/errors');
const lodash = require('lodash');
const { FEATURE_VIDEOCONFERENCE_ENABLED } = require('../../../config/globals'); // todo use config
const { VIDEOCONFERENCE } = require('../../../src/services/school/model').SCHOOL_FEATURES;

const videoconferenceHooks = require('./hooks');

const { getUser } = require('../../hooks');

const {
	createMeeting,
	getMeetingInfo,
} = require('./logic');

const {
	copyPropertyNameIfIncludedInValuesFromSourceToTarget,
	isValidNotFoundResponse,
	isValidFoundResponse,
} = require('./logic/utils');

const server = require('./logic/server');
const {
	ROLES,
	PERMISSIONS,
	SCOPE_NAMES,
	RESPONSE_STATUS,
	STATES,
	CREATE_OPTION_TOGGLES,
	GUEST_POLICIES,
} = require('./logic/constants');

const VideoconferenceModel = require('./model');
const { schoolModel: Schools } = require('../school/model');

const { ObjectId } = require('../../helper/compare');

class VideoconferenceBaseService {
	constructor(app) {
		this.app = app;
		this.docs = {};
	}


	static throwOnValidationErrors(scopeId, scopeName, options = null) {
		if (!VideoconferenceBaseService.idAndScopeNameAreValid({ scopeId, scopeName })) {
			throw new BadRequest('id or scopeName invalid');
		}
		if (options !== null) {
			const validOptions = VideoconferenceBaseService.getValidOptions(options);
			if (!lodash.isEqual(options, validOptions)) {
				throw new BadRequest('options invalid'); // todo cleanup
			}
		}
	}

	static async throwOnFeaturesDisabled(authenticatedUser) {
		// throw, if feature has not been enabled
		if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
			throw new Forbidden('feature FEATURE_VIDEOCONFERENCE_ENABLED disabled');
		}
		// throw, if current users school feature is not enabled
		const schoolFeatureEnabled = await VideoconferenceBaseService
			.isSchoolFeatureEnabled(authenticatedUser.schoolId);
		if (!schoolFeatureEnabled) {
			throw new Forbidden('school feature disabled');
		}
	}

	static throwOnPermissionMissingInScope(permission, permissions) {
		if (!VideoconferenceBaseService.userIsAllowedTo(permission, permissions)) {
			throw new Forbidden(`permission ${permission} not given in scope`);
		}
	}

	/**
	 * Takes valid and enabled options and returns the enabled toggles
	 * @param {*} options
	 */
	static getValidOptions(options = {}) {
		const validOptions = {};
		const toggleOptions = Object.getOwnPropertyNames(CREATE_OPTION_TOGGLES);
		toggleOptions.forEach((option) => {
			copyPropertyNameIfIncludedInValuesFromSourceToTarget({
				source: options,
				propertyName: option,
				values: [true, false],
				target: validOptions,
				sourcePropertyNames: toggleOptions,
			});
		});
		return validOptions;
	}


	/**
	 * checks if the school feature is enabled
	 * @param {String} schoolId
	 * @returns Boolean
	 */
	static async isSchoolFeatureEnabled(schoolId) {
		const school = await Schools.findById(schoolId).lean().exec();
		if (school && school.features
			&& Array.isArray(school.features)
			&& school.features.includes(VIDEOCONFERENCE)) {
			return true;
		}
		return false;
	}

	static userHasVideoconferencePermissionsInScope(userPermissions) {
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
	static userIsAllowedTo(permission, usersPermissions) {
		return usersPermissions.includes(permission);
	}

	static getUserRole(userPermissionsInScope) {
		if (VideoconferenceBaseService.userIsAllowedTo(PERMISSIONS.START_MEETING, userPermissionsInScope)) {
			return ROLES.MODERATOR;
		}
		if (VideoconferenceBaseService.userIsAllowedTo(PERMISSIONS.JOIN_MEETING, userPermissionsInScope)) {
			return ROLES.ATTENDEE;
		}
		throw new Error('no permission to start or join a videoconference');
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
		let scopeTitle;
		// retrieve scope information, set roomName AND scopePermissionService OR throw
		switch (scopeName) {
			case (SCOPE_NAMES.COURSE):
				// fetch course metadata
				// eslint-disable-next-line prefer-destructuring
				scopeTitle = (await app.service('courses').get(scopeId)).name;
				scopePermissionService = app.service('/courses/:scopeId/userPermissions');
				break;
			default:
				throw new BadRequest('invalid scope information given');
		}

		// check permissions and set role
		const { [user.id]: userPermissionsInScope } = await scopePermissionService.find({
			route: { scopeId },
			query: { userId: user.id },
		});
		// todo filter permissions to meeting permissions
		return { scopeTitle, userPermissionsInScope };
	}

	// /**
	//  * fetches deils about an existing meeting
	//  * @param {*} params
	//  */
	// find(params) {
	// 	// check feature is enabled
	// 	if (!FEATURE_VIDEOCONFERENCE_ENABLED === true) {
	// 		throw new Forbidden('FEATURE_VIDEOCONFERENCE_ENABLED disabled');
	// 	}
	// 	if (this.idAndScopeNameAreValid(params)) {
	// 		throw new BadRequest('id or scope name invalid');
	// 	}
	// 	try {
	// 		// TODO check user permissions in given scope, request scope type in params
	// 		// check scope is valid
	// 		const meeting = getMeetingInfo(server, params.id);
	// 		if (meeting === false) {
	// 			return new NotFound();
	// 		}
	// 		return { meeting };
	// 	} catch (err) {
	// 		error(err);
	// 		throw new GeneralError('requesting meeting info failed');
	// 	}
	// }

	static idAndScopeNameAreValid(params) {
		return ObjectId.isValid(params.scopeId)
			&& Object.values(SCOPE_NAMES).includes(params.scopeName);
	}

	static getHighestVideoconferencePermission(permissions) {
		if (permissions.includes(PERMISSIONS.START_MEETING)) return PERMISSIONS.START_MEETING;
		if (permissions.includes(PERMISSIONS.JOIN_MEETING)) return PERMISSIONS.JOIN_MEETING;
		return null;
	}

	static createResponse(status, state, permissions, url = undefined, options = []) {
		const permission = VideoconferenceBaseService
			.getHighestVideoconferencePermission(permissions);
		return {
			status, state, permission, url, options,
		};
	}


	/**
 * fetchs the VideoconferenceModel with given scopeName and scopeId and returns it.
 * the model will be defined when a videoconference is created/starts.
 * some of the options are reused from other users for join link generation
 * @param {String} scopeName
 * @param {String} scopeId
 * @re
 */
	static async getVideocenceOptions(scopeName, scopeId) {
		const modelDefaults = VideoconferenceBaseService.getDefaultModel(scopeName, scopeId);
		const videoconferenceSettings = await VideoconferenceModel
			.findOne(modelDefaults).lean().exec();
		return videoconferenceSettings;
	}

	static getDefaultModel(scopeName, scopeId) {
		const collectionNameFor = (scope) => {
			if (scope === 'course') return 'courses';
			throw new Error();
		};
		return { targetModel: collectionNameFor(scopeName), target: scopeId };
	}


	/**
	 * This translates internal params for creation into options from bbb.
	 * @param {String} userId
	 * @param {VideoconferenceOptions} params

	 * @returns bbb settings

	 */
	static getCreationSettings(userID, userPermissions, {
		moderatorMustApproveJoinRequests = false,
		everybodyJoinsAsModerator = false,
		everyAttendeJoinsMuted = false,
		// rolesAllowedToAttendVideoconference = [],
		// rolesAllowedToStartVideoconference = [],
	}) {
		// set default settings first...
		const role = VideoconferenceBaseService.getUserRole(userPermissions);
		const settings = {
			userID,
			allowStartStopRecording: false,
			guestPolicy: GUEST_POLICIES.ALWAYS_DENY,
		};

		// modify them based on option toggles...

		if (moderatorMustApproveJoinRequests) {
			// todo others are guests and guest policy may be updated
		}
		if (everybodyJoinsAsModerator) {
			// here we override the current role the user will have
		}
		if (everyAttendeJoinsMuted) {
			// here we override the current sound settings for non-moderators
		}
		return { role, settings };
	}
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
	* @typedef {Object} VideoconferenceOptions
	* @property {Boolean} [params.moderatorMustApproveJoinRequests=false]
	* - let moderators approve everybody who jons the videoconference
	* @property {Boolean} [params.everybodyJoinsAsModerator=false] - let everybody join the videoconference as moderator
	* @property {Boolean} [params.everyAttendeJoinsMuted=false] - let everybody except moderators join muted
	* @property {[String]} [params.rolesAllowedToAttendVideoconference] - scope roles who may attend the videoconference
	* @property {[String]} [params.rolesAllowedToStartVideoconference] - scope role who may start the videoconference
	*/

class GetVideoconferenceService extends VideoconferenceBaseService {
	/**
	 *
	 * @param {String} scopeId the id of a scope, the videoconference is related to
	 * @param {Object} params
	 * @param {String} params.route.scopeName the scope name for given scope id
	 * @returns {VideoConference}
	 */
	async get(scopeId, params) {
		const { scopeName } = params.route;

		// PARAMETER VALIDATION ///////////////////////////////////////////////////
		VideoconferenceBaseService.throwOnValidationErrors(scopeId, scopeName);

		const { app } = this;
		const authenticatedUser = await getUser({ params, app });
		const { userPermissionsInScope } = await this
			.getScopeInfo(app, authenticatedUser, scopeName, scopeId);

		// CHECK PERMISSIONS //////////////////////////////////////////////////////
		VideoconferenceBaseService.throwOnFeaturesDisabled(authenticatedUser);
		VideoconferenceBaseService.throwOnPermissionMissingInScope(
			PERMISSIONS.JOIN_MEETING, userPermissionsInScope,
		);

		// check videoconference metadata have been already defined locally and videoconference is running
		const videoconferenceMetadata = await VideoconferenceBaseService
			.getVideocenceOptions(scopeName, scopeId);
		const meetingInfo = await getMeetingInfo(server, scopeId);

		if (isValidNotFoundResponse(meetingInfo)) {
			// meeting is not started yet or finihed --> wait (permission: join) or start (permission: start)
			const wasRunning = !!videoconferenceMetadata;
			return VideoconferenceBaseService.createResponse(
				RESPONSE_STATUS.SUCCESS,
				wasRunning ? STATES.FINISHED : STATES.NOT_STARTED,
				userPermissionsInScope,
				undefined,
				videoconferenceMetadata,
			);
		}

		if (isValidFoundResponse(meetingInfo)) {
			// meeting already has started --> join (again)
			const { role, settings } = VideoconferenceBaseService
				.getCreationSettings(authenticatedUser.id, userPermissionsInScope, videoconferenceMetadata.options);
			const joinUrl = await createMeeting(
				server,
				undefined,
				scopeId,
				authenticatedUser.fullName,
				role,
				settings,
			);
			if (joinUrl) {
				return VideoconferenceBaseService.createResponse(
					RESPONSE_STATUS.SUCCESS,
					STATES.RUNNING,
					userPermissionsInScope,
					joinUrl,
					videoconferenceMetadata,
				);
			}
		}

		throw new GeneralError('could not fetch videoconference join url');
	}
}

class CreateVideoconferenceService extends VideoconferenceBaseService {
	/**
 *			reates an videoconference url to join a meeting, inside a s				e defined by
	 * id and scopeName dependi			 on permiss		on		 as moderator or attendee.
	 * t	his may fail due missing permissions
	 * @param {{scopeName:string, id:string}} data
	 * @param {VideoconferenceOptions} params
	 * @returns {CreateResponse} to authenticate through browser redirect
	 * @returns NotFound, if the videoconference hasn't started yet and the user is not allowed to start it
	 * @returns Forbidden, if the user is not allowed to join or create the videocoference or access this
	 * service while corerct parameters are given or the feature is disabled
	 */
	async create(data = {}, params) {
		const { scopeName, scopeId, options = {} } = data;

		// PARAMETER VALIDATION ///////////////////////////////////////////////////
		VideoconferenceBaseService.throwOnValidationErrors(scopeId, scopeName, options);

		const { app } = this;
		const authenticatedUser = await getUser({ params, app });
		const { scopeTitle, userPermissionsInScope } = await this
			.getScopeInfo(app, authenticatedUser, scopeName, scopeId);

		// CHECK PERMISSIONS //////////////////////////////////////////////////////
		await VideoconferenceBaseService.throwOnFeaturesDisabled(authenticatedUser);
		VideoconferenceBaseService.throwOnPermissionMissingInScope(
			PERMISSIONS.START_MEETING, userPermissionsInScope,
		);

		// TODO if event... check team feature flag, ignore for courses

		// BUSINESS LOGIC /////////////////////////////////////////		/////////////


		// check videoconference metadata have been already defined locally
		const videoconferenceMetadata = await CreateVideoconferenceService
			.updateAndReturnVideoconferenceOptions(scopeName, scopeId, options);

		// start the videoconference in bbb, no matter it's already running, return it
		try {
			// todo extend options based on metadata created before
			const { role, settings } = VideoconferenceBaseService
				.getCreationSettings(authenticatedUser.id, userPermissionsInScope, videoconferenceMetadata.options);
			const url = await createMeeting(
				server,
				scopeTitle,
				scopeId,
				authenticatedUser.fullName,
				role,
				settings,
			);
			return VideoconferenceBaseService.createResponse(
				RESPONSE_STATUS.SUCCESS,
				STATES.RUNNING,
				userPermissionsInScope,
				url,
				settings,
			);
		} catch (error) {
			if (error instanceof FeathersError) {
				throw error;
			}
			throw new GeneralError(
				'join meeting link generation failed',
				{ errors: { error } },
			);
		}
	}

	/**
 * creates or updates the VideoconferenceModel with given scopeName and scopeId and returns it.
 * the model will be defined when a videoconference is created/starts.
 * some of the options are reused from other users for join link generation
 * @param {String} scopeName
 * @param {String} scopeId
 * @param {*} options
 */
	static async updateAndReturnVideoconferenceOptions(scopeName, scopeId, options) {
		const modelDefaults = VideoconferenceBaseService.getDefaultModel(scopeName, scopeId);
		let videoconferenceSettings = await VideoconferenceBaseService.getVideocenceOptions(scopeName, scopeId);
		if (videoconferenceSettings === null) {
			const validOptions = VideoconferenceBaseService.getValidOptions(options);
			videoconferenceSettings = await new VideoconferenceModel({
				...modelDefaults, options: validOptions,
			}).save();
		}
		// todo update?
		return videoconferenceSettings;
	}
}


module.exports = function setup(app) {
	app.use('/videoconference', new CreateVideoconferenceService(app));
	app.use('/videoconference/:scopeName', new GetVideoconferenceService(app));
	const videoConferenceServices = [
		app.service('/videoconference'),
		app.service('/videoconference/:scopeName'),
	];
	videoConferenceServices.forEach((service) => service.hooks(videoconferenceHooks));
};
