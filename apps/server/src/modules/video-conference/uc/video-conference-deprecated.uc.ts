import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CalendarService } from '@infra/calendar';
import { CalendarEventDto } from '@infra/calendar/dto/calendar-event.dto';
import { ICurrentUser } from '@modules/authentication';
import { AuthorizationContextBuilder } from '@modules/authorization';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationService } from '@modules/authorization/domain';
import { CourseService } from '@modules/learnroom';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { BadRequestException, ForbiddenException, Injectable, NotImplementedException } from '@nestjs/common';
import { UserDO, VideoConferenceDO, VideoConferenceOptionsDO } from '@shared/domain/domainobject';
import { Course, TeamEntity, TeamUserEntity, User } from '@shared/domain/entity';
import { Permission, RoleName, VideoConferenceScope } from '@shared/domain/interface';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { TeamsRepo } from '@shared/repo';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import {
	BBBBaseMeetingConfig,
	BBBBaseResponse,
	BBBCreateConfigBuilder,
	BBBCreateResponse,
	BBBJoinConfigBuilder,
	BBBMeetingInfoResponse,
	BBBResponse,
	BBBRole,
	BBBService,
	GuestPolicy,
} from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { VideoConferenceOptions, defaultVideoConferenceOptions } from '../interface';
import { ScopeInfo, VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from './dto';

const PermissionMapping = {
	[BBBRole.MODERATOR]: Permission.START_MEETING,
	[BBBRole.VIEWER]: Permission.JOIN_MEETING,
};

const PermissionScopeMapping = {
	[VideoConferenceScope.COURSE]: AuthorizableReferenceType.Course,
	[VideoConferenceScope.EVENT]: AuthorizableReferenceType.Team,
};

/**
 * This uc is deprecated. Please use the new video conference ucs instead.
 */
@Injectable()
export class VideoConferenceDeprecatedUc {
	private readonly hostURL: string;

	constructor(
		private readonly bbbService: BBBService,
		private readonly authorizationService: AuthorizationService,
		private readonly videoConferenceRepo: VideoConferenceRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly courseService: CourseService,
		private readonly userService: UserService,
		private readonly calendarService: CalendarService,
		private readonly schoolService: LegacySchoolService
	) {
		this.hostURL = Configuration.get('HOST') as string;
	}

	/**
	 * Creates a new video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @param {VideoConferenceOptions} options
	 * @returns {Promise<VideoConference<BBBCreateResponse>>}
	 */
	async create(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId,
		options: VideoConferenceOptions
	): Promise<VideoConference<BBBCreateResponse>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);
		const scopeInfo: ScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeInfo.scopeId);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException(
				ErrorStatus.INSUFFICIENT_PERMISSION,
				'you are not allowed to start the videoconference. ask a moderator.'
			);
		}

		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: VideoConferenceDeprecatedUc.sanitizeString(scopeInfo.title),
			meetingID: refId,
		}).withLogoutUrl(scopeInfo.logoutUrl);

		if (options.moderatorMustApproveJoinRequests) {
			configBuilder.withGuestPolicy(GuestPolicy.ASK_MODERATOR);
		}

		if (options.everyAttendeeJoinsMuted) {
			configBuilder.withMuteOnStart(true);
		}

		let vcDo: VideoConferenceDO;
		try {
			// Patch options, if preset exists
			vcDo = await this.videoConferenceRepo.findByScopeAndScopeId(refId, conferenceScope);
			vcDo.options = options;
		} catch (error) {
			// Create new preset
			vcDo = new VideoConferenceDO({
				target: refId,
				targetModel: conferenceScope,
				options,
			});
		}
		await this.videoConferenceRepo.save(vcDo);

		const bbbResponse: BBBResponse<BBBCreateResponse> = await this.bbbService.create(configBuilder.build());

		return new VideoConference<BBBCreateResponse>({
			state: VideoConferenceState.NOT_STARTED,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
		});
	}

	/**
	 * Generates a join link for a video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @returns {Promise<VideoConferenceJoinDTO>}
	 */
	async join(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceJoin> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: ScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeInfo.scopeId);

		const resolvedUser: UserDO = await this.userService.findById(userId);
		const configBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: VideoConferenceDeprecatedUc.sanitizeString(`${resolvedUser.firstName} ${resolvedUser.lastName}`),
			meetingID: refId,
			role: bbbRole,
		});

		const isGuest: boolean = await this.isExpert(currentUser, conferenceScope, scopeInfo.scopeId);
		const vcDO: VideoConferenceDO = await this.videoConferenceRepo.findByScopeAndScopeId(refId, conferenceScope);
		configBuilder.withUserId(currentUser.userId);

		if (isGuest) {
			configBuilder.asGuest(true);
		}

		if (vcDO.options.everybodyJoinsAsModerator && !isGuest) {
			configBuilder.withRole(BBBRole.MODERATOR);
		}

		if (!vcDO.options.moderatorMustApproveJoinRequests && isGuest) {
			throw new ForbiddenException(
				ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE,
				'Guests cannot join this conference, since the waiting room is not enabled.'
			);
		}

		const url: string = await this.bbbService.join(configBuilder.build());

		return new VideoConferenceJoin({
			state: VideoConferenceState.RUNNING,
			permission: PermissionMapping[bbbRole],
			url,
		});
	}

	/**
	 * Retrieves information about a video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @returns {BBBResponse<BBBBaseMeetingConfig>}
	 */
	async getMeetingInfo(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceInfo> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: ScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeInfo.scopeId);

		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: refId,
		});

		const options: VideoConferenceOptionsDO = await this.videoConferenceRepo
			.findByScopeAndScopeId(refId, conferenceScope)
			.then((vcDO: VideoConferenceDO) => vcDO.options)
			.catch(() => defaultVideoConferenceOptions);

		const response: VideoConferenceInfo = await this.bbbService
			.getMeetingInfo(config)
			.then(
				(bbbResponse: BBBResponse<BBBMeetingInfoResponse>) =>
					new VideoConferenceInfo({
						state: VideoConferenceState.RUNNING,
						permission: PermissionMapping[bbbRole],
						bbbResponse,
						options: bbbRole === BBBRole.MODERATOR ? options : ({} as VideoConferenceOptions),
					})
			)
			.catch(
				() =>
					new VideoConferenceInfo({
						state: VideoConferenceState.NOT_STARTED,
						permission: PermissionMapping[bbbRole],
						options: bbbRole === BBBRole.MODERATOR ? options : ({} as VideoConferenceOptions),
					})
			);

		const isGuest: boolean = await this.isExpert(currentUser, conferenceScope, scopeInfo.scopeId);

		if (!this.canGuestJoin(isGuest, response.state, options.moderatorMustApproveJoinRequests)) {
			throw new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE);
		}

		return response;
	}

	/**
	 * Checks whether a guest can join a conference.
	 * They only can join a conference:
	 * <ul>
	 *     <li>when the user has the role as a guest</li>
	 *     <li>when a meeting is running</li>
	 *     <li>when a waiting room is set</li>
	 * </ul>
	 * @param {boolean} isGuest
	 * @param {VideoConferenceState} state, information about the video conference
	 * @param {boolean} waitingRoomEnabled, is a waiting room opened up
	 */
	protected canGuestJoin(isGuest: boolean, state: VideoConferenceState, waitingRoomEnabled: boolean): boolean {
		if ((isGuest && state === VideoConferenceState.NOT_STARTED) || (isGuest && !waitingRoomEnabled)) {
			return false;
		}
		return true;
	}

	/**
	 * Ends a video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @returns {Promise<VideoConference<BBBBaseResponse>>}
	 */
	async end(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConference<BBBBaseResponse>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const { scopeId } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeId);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
		}

		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: refId,
		});

		const bbbResponse: BBBResponse<BBBBaseResponse> = await this.bbbService.end(config);

		return new VideoConference<BBBBaseResponse>({
			state: VideoConferenceState.FINISHED,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
		});
	}

	protected async isExpert(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		scopeId: string
	): Promise<boolean> {
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const roles: RoleName[] = currentUser.roles.map((role) => role as RoleName);

				return roles.includes(RoleName.EXPERT);
			}
			case VideoConferenceScope.EVENT: {
				const team: TeamEntity = await this.teamsRepo.findById(scopeId);
				const teamUser: TeamUserEntity | undefined = team.teamUsers.find(
					(userInTeam: TeamUserEntity) => userInTeam.user.id === currentUser.userId
				);

				if (teamUser === undefined) {
					throw new ForbiddenException(ErrorStatus.UNKNOWN_USER, 'Cannot find user in team.');
				}

				return teamUser.role.name === RoleName.TEAMEXPERT;
			}
			/* istanbul ignore next */
			default:
				throw new BadRequestException('Unknown scope name.');
		}
	}

	/**
	 * Retrieves information about the permission scope based on the scope of the video conference.
	 * @param {EntityId} userId
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @returns {Promise<ScopeInfo>}
	 */
	protected async getScopeInfo(
		userId: EntityId,
		conferenceScope: VideoConferenceScope,
		refId: string
	): Promise<ScopeInfo> {
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const course: Course = await this.courseService.findById(refId);
				return {
					scopeId: refId,
					scopeName: 'courses',
					logoutUrl: `${this.hostURL}/courses/${refId}?activeTab=tools`,
					title: course.name,
				};
			}
			case VideoConferenceScope.EVENT: {
				const event: CalendarEventDto = await this.calendarService.findEvent(userId, refId);
				return {
					scopeId: event.teamId,
					scopeName: 'teams',
					logoutUrl: `${this.hostURL}/teams/${event.teamId}?activeTab=events`,
					title: event.title,
				};
			}
			default:
				throw new BadRequestException('Unknown scope name');
		}
	}

	/**
	 * Checks if the user has the required permissions and returns their associated role in BBB.
	 * @param {EntityId} userId
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} entityId
	 * @throws {ForbiddenException}
	 * @returns {Promise<BBBRole>}
	 */
	protected async checkPermission(
		userId: EntityId,
		conferenceScope: VideoConferenceScope,
		entityId: EntityId
	): Promise<BBBRole> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const permissionMap: Map<Permission, Promise<boolean>> = this.hasReadPermissions(
			user,
			PermissionScopeMapping[conferenceScope],
			entityId,
			[Permission.START_MEETING, Permission.JOIN_MEETING]
		);

		if (await permissionMap.get(Permission.START_MEETING)) {
			return BBBRole.MODERATOR;
		}
		if (await permissionMap.get(Permission.JOIN_MEETING)) {
			return BBBRole.VIEWER;
		}
		throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
	}

	private hasReadPermissions(
		user: User,
		entityName: AuthorizableReferenceType,
		entityId: EntityId,
		permissions: Permission[]
	): Map<Permission, Promise<boolean>> {
		const returnMap: Map<Permission, Promise<boolean>> = new Map();
		permissions.forEach((permission) => {
			const context = AuthorizationContextBuilder.read([permission]);
			const permissionPromise = this.hasCourseOrTeamReadPermission(user, entityName, entityId, context);

			returnMap.set(permission, permissionPromise);
		});

		return returnMap;
	}

	private hasCourseOrTeamReadPermission(
		user: User,
		entityName: AuthorizableReferenceType,
		entityId: EntityId,
		context: AuthorizationContext
	): Promise<boolean> {
		let hasPermission: Promise<boolean>;

		if (entityName === AuthorizableReferenceType.Course) {
			hasPermission = this.hasCourseReadPermission(user, entityId, context);
		} else if (entityName === AuthorizableReferenceType.Team) {
			hasPermission = this.hasTeamReadPermission(user, entityId, context);
		} else {
			throw new NotImplementedException('Unknown video conference scope');
		}

		return hasPermission;
	}

	private async hasCourseReadPermission(
		user: User,
		courseId: EntityId,
		context: AuthorizationContext
	): Promise<boolean> {
		const course = await this.courseService.findById(courseId);
		const hasPermission = this.authorizationService.hasPermission(user, course, context);

		return hasPermission;
	}

	private async hasTeamReadPermission(user: User, teamId: EntityId, context: AuthorizationContext): Promise<boolean> {
		const team = await this.teamsRepo.findById(teamId);
		const hasPermission = this.authorizationService.hasPermission(user, team, context);

		return hasPermission;
	}

	/**
	 * Throws an error if the feature is disabled for the school or for the entire instance.
	 * @param {EntityId} schoolId
	 * @throws {ForbiddenException}
	 */
	protected async throwOnFeaturesDisabled(schoolId: EntityId): Promise<void> {
		// throw, if the feature has not been enabled
		if (!Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED')) {
			throw new ForbiddenException(
				ErrorStatus.SCHOOL_FEATURE_DISABLED,
				'feature FEATURE_VIDEOCONFERENCE_ENABLED is disabled'
			);
		}
		// throw, if the current users school does not have the feature enabled
		const schoolFeatureEnabled: boolean = await this.schoolService.hasFeature(schoolId, SchoolFeature.VIDEOCONFERENCE);
		if (!schoolFeatureEnabled) {
			throw new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED, 'school feature VIDEOCONFERENCE is disabled');
		}
	}

	private static sanitizeString(text: string) {
		return text.replace(/[^\dA-Za-zÀ-ÖØ-öø-ÿ.\-=_`´ ]/g, '');
	}
}
