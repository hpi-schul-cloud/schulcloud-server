// eslint-disable-next-line max-classes-per-file
const lodash = require('lodash');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Forbidden, NotFound, BadRequest, GeneralError } = require('../../errors');
const { isFeatherError } = require('../../errors/utils');
const { SCHOOL_FEATURES } = require('../school/model');
const videoconferenceHooks = require('./hooks');
const { getUser } = require('../../hooks');
const { joinMeeting, getMeetingInfo } = require('./logic');
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
} = require('./logic/constants');

const CLIENT_HOST = Configuration.get('HOST');

const VideoconferenceModel = require('./model');
const { schoolModel: Schools } = require('../school/model');

const { ObjectId } = require('../../helper/compare');

// event ids are from postgres instead of mongo
function scopeIdMatchesEventId(id) {
	return /^[0-9a-f-]{36}$/.test(id);
}

function idAndScopeNameAreValid(params) {
	return (
		(ObjectId.isValid(params.scopeId) || scopeIdMatchesEventId(params.scopeId)) &&
		Object.values(SCOPE_NAMES).includes(params.scopeName)
	);
}

/**
 * Takes valid and enabled options and returns the enabled toggles
 * @param {*} options
 */
function getValidOptions(options = {}) {
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
	return validOptions;
}

function throwOnValidationErrors(scopeId, scopeName, options = null) {
	if (!idAndScopeNameAreValid({ scopeId, scopeName })) {
		throw new BadRequest('id or scopeName invalid');
	}
	if (options !== null) {
		const validOptions = getValidOptions(options);
		if (!lodash.isEqual(options, validOptions)) {
			throw new BadRequest('options invalid'); // todo cleanup
		}
	}
}

/**
 * Checks if the school feature is enabled.
 *
 * @param {String} schoolId
 * @returns Boolean
 */
async function isSchoolFeatureEnabled(schoolId) {
	const school = await Schools.findById(schoolId).lean().exec();
	if (
		school &&
		school.features &&
		Array.isArray(school.features) &&
		school.features.includes(SCHOOL_FEATURES.VIDEOCONFERENCE)
	) {
		return true;
	}
	return false;
}

async function throwOnFeaturesDisabled(authenticatedUser) {
	// throw, if feature has not been enabled
	if (!Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED')) {
		throw new Forbidden('feature FEATURE_VIDEOCONFERENCE_ENABLED disabled');
	}
	// throw, if current users school feature is not enabled
	const schoolFeatureEnabled = await isSchoolFeatureEnabled(authenticatedUser.schoolId);
	if (!schoolFeatureEnabled) {
		throw new Forbidden('school feature disabled');
	}
}

/**
 * Returns true, if the array of userPermissions includes the desired permission, otherwise returns false.
 * @param {String} permission to test to be part of usersPermissions
 * @param {[String]} usersPermissions
 * @returns {Boolean}
 */
function userIsAllowedTo(permission, usersPermissions) {
	return usersPermissions.includes(permission);
}

function throwOnPermissionMissingInScope(permission, permissions) {
	if (!userIsAllowedTo(permission, permissions)) {
		throw new Forbidden(`permission ${permission} not given in scope`);
	}
}

function throwOnNotAnyPermissionInScope(requiredPermissions, scopePermissions) {
	if (scopePermissions.filter((permission) => requiredPermissions.includes(permission)).length === 0) {
		throw new Forbidden(`one permission of ${JSON.stringify(requiredPermissions)} required in scope`);
	}
}

function getUserRole(userPermissionsInScope) {
	if (userIsAllowedTo(PERMISSIONS.START_MEETING, userPermissionsInScope)) {
		return ROLES.MODERATOR;
	}
	if (userIsAllowedTo(PERMISSIONS.JOIN_MEETING, userPermissionsInScope)) {
		return ROLES.ATTENDEE;
	}
	throw new Error('no permission to start or join a videoconference');
}

/**
 *
 * @param {Object} app Express app
 * @param {*} user
 * @param {*} copeName
 * @param {*} scopeId
 */
async function getScopeInfo(app, user, scopeName, scopeId) {
	let scopeTitle;
	let event;
	let permissionScopeId;
	let permissionScopeName;
	// retrieve scope information, set roomName AND scopePermissionService OR throw
	switch (scopeName) {
		case SCOPE_NAMES.COURSE:
			// fetch course metadata
			// eslint-disable-next-line prefer-destructuring
			permissionScopeId = scopeId;
			permissionScopeName = 'courses';
			scopeTitle = (await app.service(permissionScopeName).get(scopeId)).name;
			break;
		case SCOPE_NAMES.EVENT:
			// eslint-disable-next-line no-case-declarations
			const events = await app.service('calendar').find({
				query: { 'event-id': scopeId },
				payload: { userId: user.id },
			});
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

	let logoutURL = `${CLIENT_HOST}/${permissionScopeName}/${permissionScopeId}`;
	if (permissionScopeName === 'teams') logoutURL += '?activeTab=events';
	if (permissionScopeName === 'courses') logoutURL += '?activeTab=tools';

	return {
		scopeTitle,
		userPermissionsInScope,
		logoutURL,
	};
}

function getHighestVideoconferencePermission(permissions) {
	if (permissions.includes(PERMISSIONS.START_MEETING)) return PERMISSIONS.START_MEETING;
	if (permissions.includes(PERMISSIONS.JOIN_MEETING)) return PERMISSIONS.JOIN_MEETING;
	return null;
}

function createResponse(status, state, permissions, options = null, url) {
	const permission = getHighestVideoconferencePermission(permissions);
	return {
		status,
		state,
		permission,
		options,
		url,
	};
}

function getDefaultModel(scopeName, scopeId) {
	const collectionNameFor = (scope) => {
		if (scope === 'course') return 'courses';
		if (scope === 'event') return 'events';
		throw new Error();
	};
	return { targetModel: collectionNameFor(scopeName), target: scopeId };
}

/**
 * Fetches the VideoconferenceModel with given scopeName and scopeId and returns it.
 * the model will be defined when a video conference is created/starts.
 * some of the options are reused from other users for join link generation
 *
 * @param {String} scopeName
 * @param {String} scopeId
 * @re
 */
async function getVideoconferenceMetadata(scopeName, scopeId, returnAsObject = false) {
	const modelDefaults = getDefaultModel(scopeName, scopeId);
	const videoconferenceMetadata = await VideoconferenceModel.findOne(modelDefaults).exec();
	if (returnAsObject && videoconferenceMetadata !== null) {
		return videoconferenceMetadata.toObject();
	}
	return videoconferenceMetadata;
}

/**
 * Translates internal params for creation into options from bbb.
 *
 * @param {String} userId
 * @param {VideoconferenceOptions} params.options
 * @param {String} params.scopeName
 * @param {String} params.scopeId

 * @returns bbb settings

*/
function getSettings(
	userID,
	userPermissions,
	{
		options: {
			moderatorMustApproveJoinRequests = false,
			everybodyJoinsAsModerator = false,
			everyAttendeJoinsMuted = false,
		},
	},
	logoutURL = undefined
) {
	let role = getUserRole(userPermissions);
	const settings = {
		userID,
		allowStartStopRecording: false,
		lockSettingsDisablePrivateChat: true,
		logoutURL,
	};

	if (moderatorMustApproveJoinRequests && role !== ROLES.MODERATOR) {
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

/**
 * @typedef {Object} VideoConference
 * @property {[url:Url]} the url to join the video conference
 * @property {[state:STATE]} the current state in which the video conference is in
 * @property {success:'SUCCESS'|'ERROR'} status indicator
 * @property {[permissions:[String]]} user permissions
 * @property {[error:String]} error message indication string
 */

/**
 * @typedef {Object} VideoconferenceOptions
 * @property {Boolean} [params.moderatorMustApproveJoinRequests=false]
 * - let moderators approve everybody who joins the video conference
 * @property {Boolean} [params.everybodyJoinsAsModerator=false] - let everybody join the video conference as moderator
 * @property {Boolean} [params.everyAttendeJoinsMuted=false] - let everybody except moderators join muted
 * @property {[String]} [params.rolesAllowedToAttendVideoconference] - scope roles who may attend the video conference
 * @property {[String]} [params.rolesAllowedToStartVideoconference] - scope role who may start the video conference
 */

/**
 * Creates or updates the VideoconferenceModel with given scopeName and scopeId
 * and returns it. The model will be defined when a video conference is
 * created/starts.
 *
 * Some of the options are reused from other users for join link generation.
 *
 * @param {String} scopeName
 * @param {String} scopeId
 * @param {*} options
 */
async function updateAndGetVideoconferenceMetadata(scopeName, scopeId, options) {
	const modelDefaults = getDefaultModel(scopeName, scopeId);
	let videoconferenceSettings = await getVideoconferenceMetadata(scopeName, scopeId);
	if (videoconferenceSettings === null) {
		videoconferenceSettings = await new VideoconferenceModel({
			...modelDefaults,
		});
	}
	const validOptions = getValidOptions(options);
	Object.assign(videoconferenceSettings.options, validOptions);
	await videoconferenceSettings.save();
	return videoconferenceSettings;
}

class GetVideoconferenceService {
	constructor(app) {
		this.app = app;
		this.docs = {};
	}

	/**
	 *
	 * @param {String} scopeId the id of a scope, the video conference is related to
	 * @param {Object} params
	 * @param {String} params.route.scopeName the scope name for given scope id
	 * @returns {VideoConference}
	 */
	async get(scopeId, params) {
		const { scopeName } = params.route;

		// PARAMETER VALIDATION ///////////////////////////////////////////////////
		throwOnValidationErrors(scopeId, scopeName);

		const { app } = this;
		const authenticatedUser = await getUser({ params, app });
		const { userPermissionsInScope } = await getScopeInfo(app, authenticatedUser, scopeName, scopeId);

		// CHECK PERMISSIONS //////////////////////////////////////////////////////
		await throwOnFeaturesDisabled(authenticatedUser);
		throwOnPermissionMissingInScope(PERMISSIONS.JOIN_MEETING, userPermissionsInScope);

		// check video conference metadata have been already defined locally and video conference is running
		const videoconferenceMetadata = await getVideoconferenceMetadata(scopeName, scopeId, true);
		const meetingInfo = await getMeetingInfo(server, scopeId);

		const hasStartPermission = userPermissionsInScope.includes(PERMISSIONS.START_MEETING);
		const hasOptions = videoconferenceMetadata !== null && videoconferenceMetadata.options !== undefined;

		if (isValidNotFoundResponse(meetingInfo)) {
			// meeting is not started yet or finihed --> wait (permission: join) or start (permission: start)
			const wasRunning = !!videoconferenceMetadata;
			return createResponse(
				RESPONSE_STATUS.SUCCESS,
				wasRunning ? STATES.FINISHED : STATES.NOT_STARTED,
				userPermissionsInScope,
				hasStartPermission && hasOptions ? videoconferenceMetadata.options : {}
			);
		}

		if (isValidFoundResponse(meetingInfo)) {
			return createResponse(
				RESPONSE_STATUS.SUCCESS,
				STATES.RUNNING,
				userPermissionsInScope,
				hasStartPermission && hasOptions ? videoconferenceMetadata.options : {}
			);
		}

		throw new GeneralError('could not fetch videoconference join url');
	}
}

class CreateVideoconferenceService {
	constructor(app) {
		this.app = app;
		this.docs = {};
	}

	/**
	 * Creates a video conference URL to join a meeting, inside a scope defined
	 * by id and scopeName, as moderator or attendee depending on permission.
	 *
	 * This may fail due insufficient permissions.
	 *
	 * @param {{scopeName:string, id:string}} data
	 * @param {VideoconferenceOptions} params
	 * @returns {CreateResponse} to authenticate through browser redirect
	 * @returns NotFound, if the video conference hasn't started yet and the user is not allowed to start it
	 * @returns Forbidden, if the user is not allowed to join or create the video conference or access this
	 * service while correct parameters are given or the feature is disabled
	 */
	async create(data = {}, params) {
		const { scopeName, scopeId, options = {} } = data;

		// PARAMETER VALIDATION ///////////////////////////////////////////////////
		throwOnValidationErrors(scopeId, scopeName, options);

		const { app } = this;
		const authenticatedUser = await getUser({ params, app });
		const { scopeTitle, userPermissionsInScope, logoutURL } = await getScopeInfo(
			app,
			authenticatedUser,
			scopeName,
			scopeId
		);

		// CHECK PERMISSIONS //////////////////////////////////////////////////////
		await throwOnFeaturesDisabled(authenticatedUser);
		throwOnNotAnyPermissionInScope([PERMISSIONS.START_MEETING, PERMISSIONS.JOIN_MEETING], userPermissionsInScope);

		// TODO if event... check team feature flag, ignore for courses

		// BUSINESS LOGIC /////////////////////////////////////////////////////////

		try {
			let joinUrl = null;
			let videoconferenceMetadata = null;
			const hasStartPermission = userPermissionsInScope.includes(PERMISSIONS.START_MEETING);

			if (hasStartPermission) {
				videoconferenceMetadata = (await updateAndGetVideoconferenceMetadata(scopeName, scopeId, options)).toObject();

				// todo extend options based on metadata created before
				const { role, settings } = getSettings(
					authenticatedUser.id,
					userPermissionsInScope,
					videoconferenceMetadata,
					logoutURL
				);
				joinUrl = await joinMeeting(server, scopeTitle, scopeId, authenticatedUser.fullName, role, settings, true);
			} else {
				// (hasJoinPermission)
				videoconferenceMetadata = await getVideoconferenceMetadata(scopeName, scopeId, true);
				if (videoconferenceMetadata === null) {
					return new NotFound("ask a moderator to start the videoconference, it's not started yet");
				}
				const { role, settings } = getSettings(
					authenticatedUser.id,
					userPermissionsInScope,
					videoconferenceMetadata,
					logoutURL
				);
				// joinMeeting throws, if video conference has not started yet
				joinUrl = await joinMeeting(server, scopeTitle, scopeId, authenticatedUser.fullName, role, settings, false);
			}
			return createResponse(
				RESPONSE_STATUS.SUCCESS,
				STATES.RUNNING,
				userPermissionsInScope,
				hasStartPermission ? videoconferenceMetadata.options : {},
				joinUrl
			);
		} catch (error) {
			if (isFeatherError(error)) {
				throw error;
			}
			throw new GeneralError('join meeting link generation failed', { errors: error });
		}
	}
}

module.exports = function setup(app) {
	app.use('/videoconference/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/videoconference', new CreateVideoconferenceService(app));
	app.use('/videoconference/:scopeName', new GetVideoconferenceService(app));
	const videoConferenceServices = [app.service('/videoconference'), app.service('/videoconference/:scopeName')];
	videoConferenceServices.forEach((service) => service.hooks(videoconferenceHooks));
};
