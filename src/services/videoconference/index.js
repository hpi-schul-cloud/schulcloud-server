const {
	BadRequest,
	Forbidden,
	NotFound,
	GeneralError,
	FeathersError,
} = require('@feathersjs/errors');
const lodash = require('lodash');
const { Configuration } = require('@schul-cloud/commons');

const Config = new Configuration();
Config.init();

const { SCHOOL_FEATURES } = require('../../../src/services/school/model');

const videoconferenceHooks = require('./hooks');
const { isUrl } = require('./logic/utils');


const { getUser } = require('../../hooks');

const {
	joinMeeting,
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

const CLIENT_HOST = process.env.HOST;

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
		if (!Config.get('FEATURE_VIDEOCONFERENCE_ENABLED') === true) {
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

	static throweOnNotAnyPermissionInScope(requiredPermissions, scopePermissions) {
		if (scopePermissions.filter((permission) => requiredPermissions.includes(permission)).length === 0) {
			throw new Forbidden(`one permission of ${JSON.stringify(requiredPermissions)} required in scope`);
		}
	}

	/**
	 * Takes valid and enabled options and returns the enabled toggles
	 * @param {*} options
	 */
	static getValidOptions(options = {}) {
		const validOptions = {};
		const toggleOptions = Object.values(CREATE_OPTION_TOGGLES);
		toggleOptions.forEach((option) => {
			copyPropertyNameIfIncludedInValuesFromSourceToTarget({
				source: options,
				propertyName: option,
				values: [true, false],
				target: validOptions,
				sourcePropertyNames: toggleOptions,
			});
		});
		if (options.filename && typeof options.filename === 'string' && isUrl(options.filename)) {
			validOptions.filename = options.filename;
		}
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
			&& school.features.includes(SCHOOL_FEATURES.VIDEOCONFERENCE)) {
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
		let scopeTitle;
		let event;
		let permissionScopeId;
		let permissionScopeName;
		// retrieve scope information, set roomName AND scopePermissionService OR throw
		switch (scopeName) {
			case (SCOPE_NAMES.COURSE):
				// fetch course metadata
				// eslint-disable-next-line prefer-destructuring
				permissionScopeId = scopeId;
				permissionScopeName = 'courses';
				scopeTitle = (await app.service(permissionScopeName).get(scopeId)).name;
				break;
			case (SCOPE_NAMES.EVENT):
				// eslint-disable-next-line no-case-declarations
				const events = (await app.service('calendar').find({
					query: { 'event-id': scopeId },
					payload: { userId: user.id },
				}));
				if (Array.isArray(events) && events.length >= 1) {
					event = events[0];
				} else {
					throw new NotFound('event not found');
				}

				permissionScopeId = event['x-sc-teamId'];
				if (!permissionScopeId) {
					throw new NotFound('could not find videoconference enabled for this event in team');
				}
				permissionScopeName = 'teams';
				scopeTitle = event.title;
				break;
			default:
				throw new BadRequest('invalid scope information given');
		}

		// check permissions and set role
		const scopePermissionService = app.service(`/${permissionScopeName}/:scopeId/userPermissions`);
		const { [user.id]: userPermissionsInScope } = await scopePermissionService.find({
			route: { scopeId: permissionScopeId },
			query: { userId: user.id },
		});
		// todo filter permissions to meeting permissions
		return {
			scopeTitle,
			userPermissionsInScope,
		};
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
		// event ids are from postgres instead of mongo
		const scopeIdMatchesEventId = (id) => /^[0-9a-f-]{36}$/.test(id);
		return (ObjectId.isValid(params.scopeId) || scopeIdMatchesEventId(params.scopeId))
			&& Object.values(SCOPE_NAMES).includes(params.scopeName);
	}

	static getHighestVideoconferencePermission(permissions) {
		if (permissions.includes(PERMISSIONS.START_MEETING)) return PERMISSIONS.START_MEETING;
		if (permissions.includes(PERMISSIONS.JOIN_MEETING)) return PERMISSIONS.JOIN_MEETING;
		return null;
	}

	static createResponse(status, state, permissions, options = null, url) {
		const permission = VideoconferenceBaseService
			.getHighestVideoconferencePermission(permissions);
		const leanOptions = (options !== null && options.toObject) ? options.toObject() : {};
		return {
			status, state, permission, options: leanOptions, url,
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
	static async getVideocenceMetadata(scopeName, scopeId, returnAsObject = false) {
		const modelDefaults = VideoconferenceBaseService.getDefaultModel(scopeName, scopeId);
		const videoconferenceMetadata = await VideoconferenceModel
			.findOne(modelDefaults).exec();
		if (returnAsObject && videoconferenceMetadata !== null) {
			return videoconferenceMetadata.toObject();
		}
		return videoconferenceMetadata;
	}

	static getDefaultModel(scopeName, scopeId) {
		const collectionNameFor = (scope) => {
			if (scope === 'course') return 'courses';
			if (scope === 'event') return 'events';
			throw new Error();
		};
		return { targetModel: collectionNameFor(scopeName), target: scopeId };
	}


	/**
	 * This translates internal params for creation into options from bbb.
	 * @param {String} userId
	 * @param {VideoconferenceOptions} params.options
	 * @param {String} params.scopeName
	 * @param {String} params.scopeId

	 * @returns bbb settings

	 */
	getSettings(
		userID,
		userPermissions, {
			targetModel,
			target,
			options: {
				moderatorMustApproveJoinRequests = false,
				everybodyJoinsAsModerator = false,
				everyAttendeJoinsMuted = false,
				filename = undefined,
			},
		},
	) {
		let role = VideoconferenceBaseService.getUserRole(userPermissions);
		const logoutURL = `${CLIENT_HOST}/${targetModel}/${target}`;
		const settings = {
			userID,
			allowStartStopRecording: false,
			lockSettingsDisablePrivateChat: true,
			logoutURL,
		};

		if (filename) {
			settings.filename = filename;
		}

		if (moderatorMustApproveJoinRequests && role !== ROLES.MODERATOR) {
			settings.guestPolicy = GUEST_POLICIES.ASK_MODERATOR;
			settings.guest = true;
		}

		if (everybodyJoinsAsModerator) {
			role = ROLES.MODERATOR;
		}

		if (everyAttendeJoinsMuted) {
			settings.muteOnStart = true;
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
		await VideoconferenceBaseService.throwOnFeaturesDisabled(authenticatedUser);
		VideoconferenceBaseService.throwOnPermissionMissingInScope(
			PERMISSIONS.JOIN_MEETING, userPermissionsInScope,
		);

		// check videoconference metadata have been already defined locally and videoconference is running
		const videoconferenceMetadata = (await VideoconferenceBaseService
			.getVideocenceMetadata(scopeName, scopeId, true));
		const meetingInfo = await getMeetingInfo(server, scopeId);

		const hasStartPermission = userPermissionsInScope.includes(PERMISSIONS.START_MEETING);
		const hasOptions = videoconferenceMetadata && videoconferenceMetadata.options;

		if (isValidNotFoundResponse(meetingInfo)) {
			// meeting is not started yet or finihed --> wait (permission: join) or start (permission: start)
			const wasRunning = !!videoconferenceMetadata;
			return VideoconferenceBaseService.createResponse(
				RESPONSE_STATUS.SUCCESS,
				wasRunning ? STATES.FINISHED : STATES.NOT_STARTED,
				userPermissionsInScope,
				hasStartPermission && hasOptions ? videoconferenceMetadata.options : {},
			);
		}

		if (isValidFoundResponse(meetingInfo)) {
			return VideoconferenceBaseService.createResponse(
				RESPONSE_STATUS.SUCCESS,
				STATES.RUNNING,
				userPermissionsInScope,
				hasStartPermission && hasOptions ? videoconferenceMetadata.options : {},
			);
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
		VideoconferenceBaseService.throweOnNotAnyPermissionInScope([
			PERMISSIONS.START_MEETING, PERMISSIONS.JOIN_MEETING,
		], userPermissionsInScope);

		// TODO if event... check team feature flag, ignore for courses

		// BUSINESS LOGIC /////////////////////////////////////////		/////////////

		try {
			let joinUrl = null;
			let videoconferenceMetadata = null;
			const hasStartPermission = userPermissionsInScope.includes(PERMISSIONS.START_MEETING);
			const hasJoinPermission = hasStartPermission || userPermissionsInScope.includes(PERMISSIONS.JOIN_MEETING);

			if (hasStartPermission) {
				videoconferenceMetadata = (await CreateVideoconferenceService
					.updateAndGetVideoconferenceMetadata(scopeName, scopeId, options)).toObject();
				// todo extend options based on metadata created before
				const { role, settings } = super
					.getSettings(
						authenticatedUser.id,
						userPermissionsInScope,
						videoconferenceMetadata,
					);
				joinUrl = await joinMeeting(
					server,
					scopeTitle,
					scopeId,
					authenticatedUser.fullName,
					role,
					settings,
					true,
				);
			} else if (hasJoinPermission) {
				// join permission given only
				videoconferenceMetadata = (await VideoconferenceBaseService
					.getVideocenceMetadata(scopeName, scopeId, true));
				if (videoconferenceMetadata === null) {
					return new NotFound('ask a moderator to start the videoconference, it\'s not started yet');
				}
				// todo check bbb has started -> 403 getmeetinginfo
				const { role, settings } = super
					.getSettings(
						authenticatedUser.id,
						userPermissionsInScope,
						videoconferenceMetadata,
					);
				joinUrl = await joinMeeting(
					server,
					scopeTitle,
					scopeId,
					authenticatedUser.fullName,
					role,
					settings,
					false,
				);
			}
			return VideoconferenceBaseService.createResponse(
				RESPONSE_STATUS.SUCCESS,
				STATES.RUNNING,
				userPermissionsInScope,
				hasStartPermission ? videoconferenceMetadata.options : {},
				joinUrl,
			);
		} catch (error) {
			if (error instanceof FeathersError) {
				throw error;
			}
			throw new GeneralError(
				'join meeting link generation failed',
				{ errors: error },
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
	static async updateAndGetVideoconferenceMetadata(scopeName, scopeId, options) {
		const modelDefaults = VideoconferenceBaseService.getDefaultModel(scopeName, scopeId);
		let videoconferenceSettings = await VideoconferenceBaseService.getVideocenceMetadata(scopeName, scopeId);
		if (videoconferenceSettings === null) {
			videoconferenceSettings = await new VideoconferenceModel({
				...modelDefaults,
			});
		}
		const validOptions = VideoconferenceBaseService.getValidOptions(options);
		Object.assign(videoconferenceSettings.options, validOptions);
		await videoconferenceSettings.save();
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
