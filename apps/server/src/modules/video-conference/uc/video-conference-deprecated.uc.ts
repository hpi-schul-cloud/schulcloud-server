import { ICurrentUser } from '@infra/auth-guard';
import { CalendarService } from '@infra/calendar';
import { CalendarEventDto } from '@infra/calendar/dto/calendar-event.dto';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { LegacySchoolService } from '@modules/legacy-school';
import { RoleName } from '@modules/role';
import { SchoolFeature } from '@modules/school/domain';
import { TeamEntity, TeamRepo, TeamUserEntity } from '@modules/team/repo';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { randomBytes } from 'node:crypto';
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
import { VideoConferenceDO, VideoConferenceOptionsDO, VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface';
import { VideoConferenceRepo } from '../repo';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from '../video-conference-config';
import { ScopeInfo, VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from './dto';

const PermissionMapping = {
	[BBBRole.MODERATOR]: Permission.START_MEETING,
	[BBBRole.VIEWER]: Permission.JOIN_MEETING,
};

/**
 * This uc is deprecated. Please use the new video conference ucs instead.
 */
@Injectable()
export class VideoConferenceDeprecatedUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly authorizationService: AuthorizationService,
		private readonly videoConferenceRepo: VideoConferenceRepo,
		private readonly teamRepo: TeamRepo,
		private readonly courseService: CourseService,
		private readonly userService: UserService,
		private readonly calendarService: CalendarService,
		private readonly schoolService: LegacySchoolService,
		@Inject(VIDEO_CONFERENCE_CONFIG_TOKEN) private readonly config: VideoConferenceConfig
	) {}

	/**
	 * Creates a new video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @param {VideoConferenceOptions} options
	 * @returns {Promise<VideoConference<BBBCreateResponse>>}
	 */
	public async create(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId,
		options: VideoConferenceOptions
	): Promise<VideoConference<BBBCreateResponse>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);
		const { scopeInfo, object } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole = await this.checkPermission(userId, object);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException(
				ErrorStatus.INSUFFICIENT_PERMISSION,
				'you are not allowed to start the videoconference. ask a moderator.'
			);
		}

		const configBuilder = new BBBCreateConfigBuilder({
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
			if (!vcDo.salt) {
				vcDo.salt = randomBytes(16).toString('hex');
			}
		} catch (error) {
			// Create new preset
			vcDo = new VideoConferenceDO({
				target: refId,
				targetModel: conferenceScope,
				options,
				salt: randomBytes(16).toString('hex'),
			});
		}
		await this.videoConferenceRepo.save(vcDo);

		const bbbResponse = await this.bbbService.create(configBuilder.withScDomain(this.config.scHostUrl).build());

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
	public async join(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceJoin> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const { scopeInfo, object } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole = await this.checkPermission(userId, object);

		const resolvedUser = await this.userService.findById(userId);
		const configBuilder = new BBBJoinConfigBuilder({
			fullName: VideoConferenceDeprecatedUc.sanitizeString(`${resolvedUser.firstName} ${resolvedUser.lastName}`),
			meetingID: refId,
			role: bbbRole,
		});

		const isGuest = await this.isExternalPersonOrTeamExpert(currentUser, conferenceScope, scopeInfo.scopeId);
		const vcDO = await this.videoConferenceRepo.findByScopeAndScopeId(refId, conferenceScope);
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

		const url = await this.bbbService.join(configBuilder.build());

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
	public async getMeetingInfo(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceInfo> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const { scopeInfo, object } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole = await this.checkPermission(userId, object);

		const config = new BBBBaseMeetingConfig({
			meetingID: refId,
		});

		// this one fails if salt is not set
		const options: VideoConferenceOptionsDO = await this.videoConferenceRepo
			.findByScopeAndScopeId(refId, conferenceScope)
			.then((vcDO: VideoConferenceDO) => vcDO.options)
			.catch(() => defaultVideoConferenceOptions);

		const response = await this.bbbService
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

		const isGuest = await this.isExternalPersonOrTeamExpert(currentUser, conferenceScope, scopeInfo.scopeId);

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
	public async end(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConference<BBBBaseResponse>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const { object } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole = await this.checkPermission(userId, object);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
		}

		const config = new BBBBaseMeetingConfig({
			meetingID: refId,
		});

		const bbbResponse = await this.bbbService.end(config);

		return new VideoConference<BBBBaseResponse>({
			state: VideoConferenceState.FINISHED,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
		});
	}

	protected async isExternalPersonOrTeamExpert(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		scopeId: string
	): Promise<boolean> {
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const roles: RoleName[] = currentUser.roles.map((role) => role as RoleName);

				return roles.includes(RoleName.EXTERNALPERSON);
			}
			case VideoConferenceScope.EVENT: {
				const team: TeamEntity = await this.teamRepo.findById(scopeId);
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
	): Promise<{ scopeInfo: ScopeInfo; object: AuthorizableObject }> {
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const course: CourseEntity = await this.courseService.findById(refId);

				return {
					scopeInfo: {
						scopeId: refId,
						scopeName: VideoConferenceScope.COURSE,
						logoutUrl: `${this.config.scHostUrl}/courses/${refId}?activeTab=tools`,
						title: course.name,
					},
					object: course,
				};
			}
			case VideoConferenceScope.EVENT: {
				const event: CalendarEventDto = await this.calendarService.findEvent(userId, refId);
				const team = await this.teamRepo.findById(event.teamId, true);

				return {
					scopeInfo: {
						scopeId: event.teamId,
						scopeName: VideoConferenceScope.EVENT,
						logoutUrl: `${this.config.scHostUrl}/teams/${event.teamId}?activeTab=events`,
						title: event.title,
					},
					object: team,
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
	protected async checkPermission(userId: EntityId, object: AuthorizableObject): Promise<BBBRole> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const permissionMap: Map<Permission, boolean> = this.hasReadPermissions(user, object, [
			Permission.START_MEETING,
			Permission.JOIN_MEETING,
		]);

		if (permissionMap.get(Permission.START_MEETING)) {
			return BBBRole.MODERATOR;
		}
		if (permissionMap.get(Permission.JOIN_MEETING)) {
			return BBBRole.VIEWER;
		}

		throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
	}

	private hasReadPermissions(
		user: User,
		object: AuthorizableObject,
		permissions: Permission[]
	): Map<Permission, boolean> {
		const returnMap: Map<Permission, boolean> = new Map();
		permissions.forEach((permission) => {
			const context = AuthorizationContextBuilder.read([permission]);
			const permissionPromise = this.authorizationService.hasPermission(user, object, context);

			returnMap.set(permission, permissionPromise);
		});

		return returnMap;
	}

	/**
	 * Throws an error if the feature is disabled for the school or for the entire instance.
	 * @param {EntityId} schoolId
	 * @throws {ForbiddenException}
	 */
	protected async throwOnFeaturesDisabled(schoolId: EntityId): Promise<void> {
		// throw, if the feature has not been enabled
		if (!this.config.featureVideoConferenceEnabled) {
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

	private static sanitizeString(text: string): string {
		return text.replace(/[^\dA-Za-zÀ-ÖØ-öø-ÿ.\-=_`´ ]/g, '');
	}
}
