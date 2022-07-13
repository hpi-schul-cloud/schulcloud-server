import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBEndConfig } from '@src/modules/video-conference/config/bbb-end.config';
import {
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
} from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { BBBJoinConfigBuilder } from '@src/modules/video-conference/builder/bbb-join-config.builder';
import { BBBCreateConfigBuilder } from '@src/modules/video-conference/builder/bbb-create-config.builder';
import { CourseRepo, TeamsRepo, UserRepo } from '@shared/repo';
import { CalendarService } from '@shared/infra/calendar';
import { BBBMeetingInfoConfig } from '@src/modules/video-conference/config/bbb-meeting-info.config';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBJoinResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { ICalendarEvent } from '@shared/infra/calendar/calendar-event.interface';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { VideoConferenceRepo } from '@shared/repo/videoconference/video-conference.repo';
import { GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';
import { VideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';
import { AuthorizationService } from '@src/modules/authorization';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';

interface IScopeInfo {
	scopeId: EntityId;
	scopeName: string;
	logoutUrl: string;
	title: string;
}

class VideoConferenceDTO<T extends BBBResponse<BBBBaseResponse>> {
	constructor(props: VideoConferenceDTO<T>) {
		super(props);
	}

	state: VideoConferenceState;

	permission: Permission;

	bbbResponse?: BBBResponse<BBBBaseResponse>;

	options?: VideoConferenceOptions;
}

const PermissionMapping = {
	[BBBRole.MODERATOR]: Permission.START_MEETING,
	[BBBRole.VIEWER]: Permission.JOIN_MEETING,
};

// TODO move to ./error/bbb.error.ts
export enum BBBError {
	NOT_FOUND = 'notFound',
}

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
	 * Creates a new video conference
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope
	 * @param {VideoConferenceOptions} options
	 * @returns {BBBResponse<BBBCreateResponse>}
	 */
	async create(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId,
		options: VideoConferenceOptions
	): Promise<ControllerResponse<BBBResponse<BBBCreateResponse>>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);
		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, scopeInfo.scopeId);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException();
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
			vcDo.options = options; // TODO Mapper?
		} catch (error) {
			// Create new preset
			vcDo = this.videoConferenceRepo.create({
				target: refId,
				targetModel: conferenceScope,
				options,
			});
		}
		await this.videoConferenceRepo.save(vcDo);

		return {
			state: VideoConferenceState.NOT_STARTED,
			permission: PermissionMapping[bbbRole],
			bbbResponse: await this.bbbService.create(configBuilder.build()),
		};
	}

	/**
	 * Generates a join link for a video conference
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope
	 * @returns {BBBResponse<BBBJoinResponse>}
	 */
	async join(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<ControllerResponse<BBBResponse<BBBJoinResponse>>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, scopeInfo.scopeId);

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
			default:
				throw new BadRequestException('Unknown scope name');
		}

		const vcDO: VideoConferenceDO = await this.videoConferenceRepo.findByScopeId(refId, conferenceScope);

		if (vcDO.options.everybodyJoinsAsModerator) {
			configBuilder.withRole(BBBRole.MODERATOR);
		}

		return {
			state: VideoConferenceState.RUNNING,
			permission: PermissionMapping[bbbRole],
			bbbResponse: await this.bbbService.join(configBuilder.build()),
		};
	}

	/**
	 * Retrieves information about a video conference
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope
	 * @returns {BBBResponse<BBBEndConfig>}
	 */
	async getMeetingInfo(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<ControllerResponse<BBBResponse<BBBMeetingInfoResponse>>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, scopeInfo.scopeId);

		const config: BBBMeetingInfoConfig = new BBBMeetingInfoConfig({
			meetingID: refId,
		});

		let info: BBBResponse<BBBMeetingInfoResponse> | undefined;
		try {
			info = await this.bbbService.getMeetingInfo(config);
		} catch (error) {
			return {
				state: VideoConferenceState.NOT_STARTED,
				permission: PermissionMapping[bbbRole],
			};
		}

		const vcDO: VideoConferenceDO = await this.videoConferenceRepo.findByScopeId(refId, conferenceScope);

		return {
			state: VideoConferenceState.RUNNING,
			permission: PermissionMapping[bbbRole],
			bbbResponse: info,
			options: bbbRole === BBBRole.MODERATOR ? vcDO.options : undefined,
		};
	}

	/**
	 * Ends a video conference
	 * @param {ICurrentUser} currentUser
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope
	 * @returns
	 */
	async end(
		currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<ControllerResponse<BBBResponse<BBBBaseResponse>>> {
		const { userId, schoolId } = currentUser;

		await this.throwOnFeaturesDisabled(schoolId);

		const { scopeId } = await this.getScopeInfo(userId, conferenceScope, refId);

		const bbbRole: BBBRole = await this.checkPermission(userId, scopeId);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException();
		}

		const config: BBBEndConfig = new BBBEndConfig({
			meetingID: refId,
		});

		return {
			state: VideoConferenceState.FINISHED,
			permission: PermissionMapping[bbbRole],
			bbbResponse: await this.bbbService.end(config),
		};
	}

	/**
	 * Retrieves information about the permission scope based on the scope of the video conference
	 * @param {EntityId} userId
	 * @param {VideoConferenceScope} conferenceScope
	 * @param {EntityId} refId eventId or courseId, depending on scope
	 * @returns {IScopeInfo}
	 */
	private async getScopeInfo(
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
				const event: ICalendarEvent = await this.calendarService.findEvent(userId, refId);
				return {
					scopeId: event['x-sc-teamId'],
					scopeName: 'teams',
					logoutUrl: `${this.hostURL}/teams/${event['x-sc-teamId']}?activeTab=events`,
					title: event.title,
				};
			}
			default:
				throw new BadRequestException('Unknown scope name');
		}
	}

	/**
	 * Checks if the user has the required permissions and returns their associated role in bbb
	 * @param {EntityId} userId
	 * @param {EntityId} entityId
	 * @throws {ForbiddenException}
	 * @returns {BBBRole}
	 */
	private async checkPermission(userId: EntityId, entityId: EntityId): Promise<BBBRole> {
		const permissionMap: Map<Permission, boolean> = await this.authorizationService.hasPermissionsByReferences(
			userId,
			AllowedAuthorizationEntityType.Course,
			entityId,
			[Permission.START_MEETING, Permission.JOIN_MEETING]
		);

		if (permissionMap.get(Permission.START_MEETING)) {
			return BBBRole.MODERATOR;
		}
		if (permissionMap.get(Permission.JOIN_MEETING)) {
			return BBBRole.VIEWER;
		}
		throw new ForbiddenException();
	}

	/**
	 * Throws an error if the feature is disabled for the school or for the entire instance
	 * @param schoolId
	 * @throws ForbiddenException
	 */
	private async throwOnFeaturesDisabled(schoolId: EntityId): Promise<void> {
		// throw, if the feature has not been enabled
		if (!Configuration.has('FEATURE_VIDEOCONFERENCE_ENABLED')) {
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
