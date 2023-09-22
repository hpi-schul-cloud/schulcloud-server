import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
	Course,
	EntityId,
	Permission,
	RoleName,
	RoleReference,
	SchoolFeatures,
	TeamEntity,
	TeamUserEntity,
	User,
	UserDO,
	VideoConferenceDO,
	VideoConferenceOptionsDO,
	VideoConferenceScope,
} from '@shared/domain';
import { CalendarEventDto, CalendarService } from '@shared/infra/calendar';
import { TeamsRepo, VideoConferenceRepo } from '@shared/repo';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { BBBRole } from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { IVideoConferenceSettings, VideoConferenceOptions, VideoConferenceSettings } from '../interface';
import { IScopeInfo, VideoConferenceState } from '../uc/dto';

@Injectable()
export class VideoConferenceService {
	constructor(
		@Inject(VideoConferenceSettings) private readonly vcSettings: IVideoConferenceSettings,
		private readonly courseService: CourseService,
		private readonly calendarService: CalendarService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly teamsRepo: TeamsRepo,
		private readonly userService: UserService,
		private readonly videoConferenceRepo: VideoConferenceRepo
	) {}

	get hostUrl(): string {
		return this.vcSettings.hostUrl;
	}

	get isVideoConferenceFeatureEnabled(): boolean {
		return this.vcSettings.enabled;
	}

	canGuestJoin(isGuest: boolean, state: VideoConferenceState, waitingRoomEnabled: boolean): boolean {
		if ((isGuest && state === VideoConferenceState.NOT_STARTED) || (isGuest && !waitingRoomEnabled)) {
			return false;
		}
		return true;
	}

	async hasExpertRole(userId: EntityId, conferenceScope: VideoConferenceScope, scopeId: string): Promise<boolean> {
		let isExpert = false;
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE: {
				const user: UserDO = await this.userService.findById(userId);
				isExpert = this.existsExpertRole(user.roles);
				return isExpert;
			}
			case VideoConferenceScope.EVENT: {
				const team: TeamEntity = await this.teamsRepo.findById(scopeId);
				const teamUser: TeamUserEntity | undefined = team.teamUsers.find(
					(userInTeam: TeamUserEntity) => userInTeam.user.id === userId
				);

				if (teamUser === undefined) {
					throw new ForbiddenException(ErrorStatus.UNKNOWN_USER, 'Cannot find user in team.');
				}

				isExpert = teamUser.role.name === RoleName.TEAMEXPERT;
				return isExpert;
			}
			default:
				throw new BadRequestException('Unknown scope name.');
		}
	}

	private existsExpertRole(roles: RoleReference[]): boolean {
		const roleNames: RoleName[] = roles.map((role: RoleReference) => role.name);

		const isExpert: boolean = roleNames.includes(RoleName.EXPERT);

		return isExpert;
	}

	// should be public to expose ressources to UC for passing it to authrisation and improve performance
	private async loadScopeRessources(
		scopeId: EntityId,
		scope: VideoConferenceScope
	): Promise<Course | TeamEntity | null> {
		let scopeRessource: Course | TeamEntity | null = null;

		if (scope === VideoConferenceScope.COURSE) {
			scopeRessource = await this.courseService.findById(scopeId);
		} else if (scope === VideoConferenceScope.EVENT) {
			scopeRessource = await this.teamsRepo.findById(scopeId);
		}

		return scopeRessource;
	}

	private isNull(value: unknown): value is null {
		return value === null;
	}

	private hasStartMeetingAndCanRead(authorizableUser: User, entity: Course | TeamEntity): boolean {
		const context = AuthorizationContextBuilder.read([Permission.START_MEETING]);
		const hasPermission = this.authorizationService.hasPermission(authorizableUser, entity, context);

		return hasPermission;
	}

	private hasJoinMeetingAndCanRead(authorizableUser: User, entity: Course | TeamEntity): boolean {
		const context = AuthorizationContextBuilder.read([Permission.JOIN_MEETING]);
		const hasPermission = this.authorizationService.hasPermission(authorizableUser, entity, context);

		return hasPermission;
	}

	async determineBbbRole(userId: EntityId, scopeId: EntityId, scope: VideoConferenceScope): Promise<BBBRole> {
		// need move to uc
		const [authorizableUser, scopeRessource]: [User, TeamEntity | Course | null] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.loadScopeRessources(scopeId, scope),
		]);

		if (!this.isNull(scopeRessource)) {
			if (this.hasStartMeetingAndCanRead(authorizableUser, scopeRessource)) {
				return BBBRole.MODERATOR;
			}
			if (this.hasJoinMeetingAndCanRead(authorizableUser, scopeRessource)) {
				return BBBRole.VIEWER;
			}
		}

		throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
	}

	async throwOnFeaturesDisabled(schoolId: EntityId): Promise<void> {
		if (!this.isVideoConferenceFeatureEnabled) {
			throw new ForbiddenException(
				ErrorStatus.SCHOOL_FEATURE_DISABLED,
				'feature FEATURE_VIDEOCONFERENCE_ENABLED is disabled'
			);
		}

		const schoolFeatureEnabled: boolean = await this.schoolService.hasFeature(schoolId, SchoolFeatures.VIDEOCONFERENCE);
		if (!schoolFeatureEnabled) {
			throw new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED, 'school feature VIDEOCONFERENCE is disabled');
		}
	}

	sanitizeString(text: string) {
		return text.replace(/[^\dA-Za-zÀ-ÖØ-öø-ÿ.\-=_`´ ]/g, '');
	}

	async getScopeInfo(userId: EntityId, scopeId: string, scope: VideoConferenceScope): Promise<IScopeInfo> {
		switch (scope) {
			case VideoConferenceScope.COURSE: {
				const course: Course = await this.courseService.findById(scopeId);

				return {
					scopeId,
					scopeName: 'courses',
					logoutUrl: `${this.hostUrl}/courses/${scopeId}?activeTab=tools`,
					title: course.name,
				};
			}
			case VideoConferenceScope.EVENT: {
				const event: CalendarEventDto = await this.calendarService.findEvent(userId, scopeId);

				return {
					scopeId: event.teamId,
					scopeName: 'teams',
					logoutUrl: `${this.hostUrl}/teams/${event.teamId}?activeTab=events`,
					title: event.title,
				};
			}
			default:
				throw new BadRequestException('Unknown scope name');
		}
	}

	async getUserRoleAndGuestStatusByUserIdForBbb(
		userId: string,
		scopeId: EntityId,
		scope: VideoConferenceScope
	): Promise<{ role: BBBRole; isGuest: boolean }> {
		const scopeInfo: IScopeInfo = await this.getScopeInfo(userId, scopeId, scope);

		const role: BBBRole = await this.determineBbbRole(userId, scopeInfo.scopeId, scope);

		const isBbbGuest: boolean = await this.hasExpertRole(userId, scope, scopeInfo.scopeId);

		return { role, isGuest: isBbbGuest };
	}

	async findVideoConferenceByScopeIdAndScope(
		scopeId: EntityId,
		scope: VideoConferenceScope
	): Promise<VideoConferenceDO> {
		const videoConference: VideoConferenceDO = await this.videoConferenceRepo.findByScopeAndScopeId(scopeId, scope);

		return videoConference;
	}

	async createOrUpdateVideoConferenceForScopeWithOptions(
		scopeId: EntityId,
		scope: VideoConferenceScope,
		options: VideoConferenceOptions
	): Promise<VideoConferenceDO> {
		let vcDo: VideoConferenceDO;

		// try and catch based on legacy behavior
		try {
			vcDo = await this.findVideoConferenceByScopeIdAndScope(scopeId, scope);

			vcDo.options = new VideoConferenceOptionsDO(options);
		} catch (error) {
			vcDo = new VideoConferenceDO({
				target: scopeId,
				targetModel: scope,
				options: new VideoConferenceOptionsDO(options),
			});
		}

		vcDo = await this.saveVideoConference(vcDo);

		return vcDo;
	}

	private async saveVideoConference(videoConference: VideoConferenceDO): Promise<VideoConferenceDO> {
		return this.videoConferenceRepo.save(videoConference);
	}
}
