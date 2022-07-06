import { ForbiddenException, Injectable } from '@nestjs/common';
import { VideoConferenceService } from '@src/modules/video-conference/service/video-conference.service';
import { BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { BBBEndConfig } from '@src/modules/video-conference/config/bbb-end.config';
import { EntityId, ICurrentUser, Permission, RoleName, SchoolFeatures, Team, TeamUser } from '@shared/domain';
import { AuthorizationService } from '@src/modules';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BBBJoinConfigBuilder } from '@src/modules/video-conference/builder/bbb-join-config.builder';
import { BBBCreateConfigBuilder } from '@src/modules/video-conference/builder/bbb-create-config.builder';
import { CourseRepo, TeamsRepo } from '@shared/repo';

@Injectable()
export class VideoConferenceUc {
	private readonly hostURL: string;

	constructor(
		private readonly videoConferenceService: VideoConferenceService,
		private readonly authorizationService: AuthorizationService,
		private readonly teamsRepo: TeamsRepo,
		private readonly courseRepo: CourseRepo
	) {
		this.hostURL = Configuration.get('HOST') as string;
	}

	async createInCourses(currentUser: ICurrentUser, courseId: EntityId): Promise<unknown> {
		const { userId } = currentUser;

		if (this.checkPermission(userId, userId) !== BBBRole.MODERATOR) {
			throw new ForbiddenException();
		}

		const course = await this.courseRepo.findById(courseId);

		const logoutURL = `${this.hostURL}/courses/${courseId}?activeTab=tools`;

		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: course.name,
			meetingID: courseId,
		}).withLogoutUrl(logoutURL);

		return this.videoConferenceService.create(configBuilder.build());
	}

	async createInTeams(currentUser: ICurrentUser, teamId: EntityId): Promise<unknown> {
		const { userId } = currentUser;

		if (this.checkPermission(userId, userId) !== BBBRole.MODERATOR) {
			throw new ForbiddenException();
		}

		// TODO get event from team calendar
		const eventId = '???';
		const eventName = '???';

		const logoutURL = `${this.hostURL}/teams/${teamId}?activeTab=events`;

		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: eventName,
			meetingID: eventId,
		}).withLogoutUrl(logoutURL);

		return this.videoConferenceService.create(configBuilder.build());
	}

	async joinInCourses(currentUser: ICurrentUser, courseId: EntityId): Promise<unknown> {
		const { userId, schoolId } = currentUser;

		this.throwOnFeaturesDisabled(schoolId);

		const bbbRole: BBBRole = this.checkPermission(userId, userId);

		const configBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: `${currentUser.user.firstName} ${currentUser.user.lastName}`,
			meetingID: '',
			role: bbbRole,
		});

		const roles: RoleName[] = currentUser.roles.map((role) => role as RoleName);
		if (roles.includes(RoleName.EXPERT)) {
			configBuilder.asGuest();
		}

		return this.videoConferenceService.join(configBuilder.build());
	}

	async joinInTeams(currentUser: ICurrentUser, teamId: EntityId): Promise<unknown> {
		const { userId, schoolId } = currentUser;

		this.throwOnFeaturesDisabled(schoolId);

		const bbbRole: BBBRole = this.checkPermission(userId, teamId);

		const configBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: `${currentUser.user.firstName} ${currentUser.user.lastName}`,
			meetingID: '',
			role: bbbRole,
		});

		const team: Team = await this.teamsRepo.findById(teamId);
		const teamUser: TeamUser | undefined = team.userIds.find(
			(userInTeam) => userInTeam.userId.id === currentUser.userId
		);

		if (teamUser === undefined) {
			throw new ForbiddenException('cannot find user in team');
		}

		if (teamUser.role.name === RoleName.TEAMEXPERT) {
			configBuilder.asGuest();
		}

		return this.videoConferenceService.join(configBuilder.build());
	}

	async end(): Promise<unknown> {
		const config: BBBEndConfig = new BBBEndConfig({
			meetingID: '',
		});

		return this.videoConferenceService.end(config);
	}

	private checkPermission(userId: EntityId, entityId: EntityId): BBBRole {
		const permissionMap: Map<Permission, boolean> = this.authorizationService.hasPermissionsByReferences(
			userId,
			AllowedAuthorizationEntityType.User,
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

	private throwOnFeaturesDisabled(schoolId: EntityId) {
		// throw, if the feature has not been enabled
		if (!Configuration.has('FEATURE_VIDEOCONFERENCE_ENABLED')) {
			throw new ForbiddenException('feature FEATURE_VIDEOCONFERENCE_ENABLED is disabled');
		}
		// throw, if the current users school does not have the feature enabled
		const schoolFeatureEnabled = this.hasFeature(schoolId, SchoolFeatures.VIDEOCONFERENCE);
		if (!schoolFeatureEnabled) {
			throw new ForbiddenException('school feature VIDEOCONFERENCE is disabled');
		}
	}

	// TODO move to school uc
	private hasFeature(schoolId: EntityId, feature: SchoolFeatures): boolean {
		// TODO implementation of logic
		return schoolId !== '' && feature === SchoolFeatures.VIDEOCONFERENCE;
	}
}
