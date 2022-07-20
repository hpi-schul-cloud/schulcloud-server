import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBBaseMeetingConfig } from '@src/modules/video-conference/config/bbb-base-meeting.config';
import {
	Actions,
	Course,
	EntityId,
	ICurrentUser,
	Permission,
	RoleName,
	SchoolFeatures,
	Team,
	TeamUser,
	User,
	VideoConferenceDO,
	VideoConferenceOptionsDO,
} from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { BBBJoinConfigBuilder } from '@src/modules/video-conference/builder/bbb-join-config.builder';
import { BBBCreateConfigBuilder } from '@src/modules/video-conference/builder/bbb-create-config.builder';
import { CourseRepo, TeamsRepo, UserRepo } from '@shared/repo';
import { CalendarService } from '@shared/infra/calendar';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';
import {
	defaultVideoConferenceOptions,
	VideoConferenceOptions,
} from '@src/modules/video-conference/interface/vc-options.interface';
import { AuthorizationService } from '@src/modules/authorization';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import {
	VideoConferenceDTO,
	VideoConferenceInfoDTO,
	VideoConferenceJoinDTO,
} from '@src/modules/video-conference/dto/video-conference.dto';
import { CalendarEventDto } from '@shared/infra/calendar/dto/calendar-event.dto';

export interface IScopeInfo {
	scopeId: EntityId;
	scopeName: string;
	logoutUrl: string;
	title: string;
}

const PermissionMapping = {
	[BBBRole.MODERATOR]: Permission.START_MEETING,
	[BBBRole.VIEWER]: Permission.JOIN_MEETING,
};

const PermissionScopeMapping = {
	[VideoConferenceScope.COURSE]: AllowedAuthorizationEntityType.Course,
	[VideoConferenceScope.EVENT]: AllowedAuthorizationEntityType.Team,
};

@Injectable()
export class VideoConferenceUc {
	private readonly hostURL: string;

	constructor(
		private readonly bbbService: BBBService,
		private readonly authorizationService: AuthorizationService,
		private readonly videoConferenceRepo: VideoConferenceRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly courseRepo: CourseRepo,
		private readonly userRepo: UserRepo,
		private readonly calendarService: CalendarService,
		private readonly schoolUc: SchoolUc
	) {
		this.hostURL = Configuration.get('HOST') as string;
	}

	/**
	 * Creates a new video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @param {VideoConferenceOptions} options
	 * @returns {Promise<VideoConferenceDTO<BBBCreateResponse>>}
	 */
	async create(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId,
		options: VideoConferenceOptions
	): Promise<VideoConferenceDTO<BBBCreateResponse>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);
		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeInfo.scopeId);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException('you are not allowed to start the videoconference. ask a moderator.');
		}

		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: VideoConferenceUc.sanitizeString(scopeInfo.title),
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
			vcDo = await this.videoConferenceRepo.findByScopeId(refId, conferenceScope);
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

		return {
			state: VideoConferenceState.NOT_STARTED,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
		};
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
	): Promise<VideoConferenceJoinDTO> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeInfo.scopeId);

		const resolvedUser: User = await this.userRepo.findById(userId);
		const configBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: VideoConferenceUc.sanitizeString(`${resolvedUser.firstName} ${resolvedUser.lastName}`),
			meetingID: refId,
			role: bbbRole,
		});

		// Let experts join as guests
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const roles: RoleName[] = currentUser.roles.map((role) => role as RoleName);

				if (roles.includes(RoleName.EXPERT)) {
					configBuilder.asGuest(true);
				}
				break;
			}
			case VideoConferenceScope.EVENT: {
				const team: Team = await this.teamsRepo.findById(scopeInfo.scopeId);
				const teamUser: TeamUser | undefined = team.userIds.find(
					(userInTeam) => userInTeam.userId.id === currentUser.userId
				);

				if (teamUser === undefined) {
					throw new ForbiddenException('cannot find user in team');
				}

				if (teamUser.role.name === RoleName.TEAMEXPERT) {
					configBuilder.asGuest(true);
				}
				break;
			}
			/* istanbul ignore next */
			default:
				throw new BadRequestException('Unknown scope name');
		}

		configBuilder.withUserId(currentUser.userId);

		const vcDO: VideoConferenceDO = await this.videoConferenceRepo.findByScopeId(refId, conferenceScope);

		if (vcDO.options.everybodyJoinsAsModerator) {
			configBuilder.withRole(BBBRole.MODERATOR);
		}

		const url: string = await this.bbbService.join(configBuilder.build());

		return {
			state: VideoConferenceState.RUNNING,
			permission: PermissionMapping[bbbRole],
			url,
		};
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
	): Promise<VideoConferenceInfoDTO> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeInfo.scopeId);

		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: refId,
		});

		let bbbResponse: BBBResponse<BBBMeetingInfoResponse>;

		const options: VideoConferenceOptionsDO = await this.videoConferenceRepo
			.findByScopeId(refId, conferenceScope)
			.then((vcDO: VideoConferenceDO) => vcDO.options)
			.catch(() => defaultVideoConferenceOptions);

		try {
			bbbResponse = await this.bbbService.getMeetingInfo(config);
		} catch (error) {
			return {
				state: VideoConferenceState.NOT_STARTED,
				permission: PermissionMapping[bbbRole],
				options: bbbRole === BBBRole.MODERATOR ? options : ({} as VideoConferenceOptions),
			};
		}

		return {
			state: VideoConferenceState.RUNNING,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
			options: bbbRole === BBBRole.MODERATOR ? options : ({} as VideoConferenceOptions),
		};
	}

	/**
	 * Ends a video conference.
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @returns {Promise<VideoConferenceDTO<BBBBaseResponse>>}
	 */
	async end(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceDTO<BBBBaseResponse>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const { scopeId } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, conferenceScope, scopeId);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException();
		}

		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: refId,
		});

		const bbbResponse: BBBResponse<BBBBaseResponse> = await this.bbbService.end(config);

		return {
			state: VideoConferenceState.FINISHED,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
		};
	}

	/**
	 * Retrieves information about the permission scope based on the scope of the video conference.
	 * @param {EntityId} userId
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope.
	 * @returns {Promise<IScopeInfo>}
	 */
	protected async getScopeInfo(
		userId: EntityId,
		conferenceScope: VideoConferenceScope,
		refId: string
	): Promise<IScopeInfo> {
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const course: Course = await this.courseRepo.findById(refId);
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
		const permissionMap: Map<Permission, Promise<boolean>> = this.authorizationService.hasPermissionsByReferences(
			userId,
			PermissionScopeMapping[conferenceScope],
			entityId,
			[Permission.START_MEETING, Permission.JOIN_MEETING],
			Actions.read
		);

		if (await permissionMap.get(Permission.START_MEETING)) {
			return BBBRole.MODERATOR;
		}
		if (await permissionMap.get(Permission.JOIN_MEETING)) {
			return BBBRole.VIEWER;
		}
		throw new ForbiddenException('insufficient permission');
	}

	/**
	 * Throws an error if the feature is disabled for the school or for the entire instance.
	 * @param {EntityId} schoolId
	 * @throws {ForbiddenException}
	 */
	protected async throwOnFeaturesDisabled(schoolId: EntityId): Promise<void> {
		// throw, if the feature has not been enabled
		if (!Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED')) {
			throw new ForbiddenException('feature FEATURE_VIDEOCONFERENCE_ENABLED is disabled');
		}
		// throw, if the current users school does not have the feature enabled
		const schoolFeatureEnabled = await this.schoolUc.hasFeature(schoolId, SchoolFeatures.VIDEOCONFERENCE);
		if (!schoolFeatureEnabled) {
			throw new ForbiddenException('school feature VIDEOCONFERENCE is disabled');
		}
	}

	private static sanitizeString(text: string) {
		return text.replace(/[^\dA-Za-zÀ-ÖØ-öø-ÿ.\-=_`´ ]/g, '');
	}
}
