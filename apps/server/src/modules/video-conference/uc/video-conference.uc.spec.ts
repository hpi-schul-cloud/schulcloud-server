import { Test, TestingModule } from '@nestjs/testing';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IScopeInfo, VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { AuthorizationService } from '@src/modules';
import { CourseRepo, TeamsRepo, UserRepo, VideoConferenceRepo } from '@shared/repo';
import { CalendarService } from '@shared/infra/calendar';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import {
	Course,
	EntityId,
	ICurrentUser,
	IResolvedUser,
	Permission,
	Role,
	RoleName,
	Team,
	User,
	VideoConferenceDO,
} from '@shared/domain';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import {
	defaultVideoConferenceOptions,
	VideoConferenceOptions,
} from '@src/modules/video-conference/interface/vc-options.interface';
import { VideoConferenceDTO, VideoConferenceJoinDTO } from '@src/modules/video-conference/dto/video-conference.dto';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { BBBCreateConfigBuilder } from '@src/modules/video-conference/builder/bbb-create-config.builder';
import { BBBJoinConfigBuilder } from '@src/modules/video-conference/builder/bbb-join-config.builder';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { roleFactory, setupEntities } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { BBBBaseMeetingConfig } from '@src/modules/video-conference/config/bbb-base-meeting.config';
import { VideoConferenceStatus } from '@src/modules/video-conference/interface/vc-status.enum';
import { GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';
import { CalendarEventDto } from '@shared/infra/calendar/dto/calendar-event.dto';

class VideoConferenceUcSpec extends VideoConferenceUc {
	async getScopeInfoSpec(userId: EntityId, conferenceScope: VideoConferenceScope, refId: string): Promise<IScopeInfo> {
		return this.getScopeInfo(userId, conferenceScope, refId);
	}

	async checkPermissionSpec(
		userId: EntityId,
		conferenceScope: VideoConferenceScope,
		entityId: EntityId
	): Promise<BBBRole> {
		return this.checkPermission(userId, conferenceScope, entityId);
	}

	async throwOnFeaturesDisabledSpec(schoolId: EntityId): Promise<void> {
		return this.throwOnFeaturesDisabled(schoolId);
	}
}

describe('VideoConferenceUc', () => {
	let orm: MikroORM;
	let module: TestingModule;
	let useCase: VideoConferenceUcSpec;

	let bbbService: DeepMocked<BBBService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let videoConferenceRepo: DeepMocked<VideoConferenceRepo>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let calendarService: DeepMocked<CalendarService>;
	let schoolUc: DeepMocked<SchoolUc>;

	const hostUrl = 'http://localhost:4000';
	const course: Course = { id: 'courseId', name: 'courseName' } as Course;
	const eventId = 'eventId';
	const event: CalendarEventDto = new CalendarEventDto({
		title: 'eventTitle',
		teamId: 'teamId',
	});
	let featureEnabled = false;
	let defaultCurrentUser: ICurrentUser;
	let defaultOptions: VideoConferenceOptions;
	const userPermissions: Map<Permission, boolean> = new Map<Permission, boolean>();

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return hostUrl;
				case 'FEATURE_VIDEOCONFERENCE_ENABLED':
					return featureEnabled;
				default:
					return null;
			}
		});

		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				VideoConferenceUcSpec,
				{
					provide: BBBService,
					useValue: createMock<BBBService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: VideoConferenceRepo,
					useValue: createMock<VideoConferenceRepo>(),
				},
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CalendarService,
					useValue: createMock<CalendarService>(),
				},
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
			],
		}).compile();
		useCase = module.get(VideoConferenceUcSpec);
		schoolUc = module.get(SchoolUc);
		authorizationService = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		calendarService = module.get(CalendarService);
		videoConferenceRepo = module.get(VideoConferenceRepo);
		userRepo = module.get(UserRepo);
		teamsRepo = module.get(TeamsRepo);
		bbbService = module.get(BBBService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
		jest.clearAllMocks();
	});

	beforeEach(() => {
		featureEnabled = true;
		defaultCurrentUser = {
			userId: '0123456789abcdef01234567',
			roles: [],
			schoolId: 'schoolId',
			accountId: 'accountId',
			user: {} as unknown as IResolvedUser,
		};
		defaultOptions = {
			everybodyJoinsAsModerator: false,
			everyAttendeeJoinsMuted: false,
			moderatorMustApproveJoinRequests: false,
		};
		userPermissions.set(Permission.JOIN_MEETING, true);
		userPermissions.set(Permission.START_MEETING, true);

		schoolUc.hasFeature.mockResolvedValue(true);
		courseRepo.findById.mockResolvedValue(course);
		calendarService.findEvent.mockResolvedValue(event);
		authorizationService.hasPermissionsByReferences.mockResolvedValue(userPermissions);
	});

	describe('getScopeInfo', () => {
		it('should return scope info for courses', async () => {
			// Act
			const scopeInfo: IScopeInfo = await useCase.getScopeInfoSpec('userId', VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(scopeInfo.scopeId).toEqual(course.id);
			expect(scopeInfo.title).toEqual(course.name);
			expect(scopeInfo.logoutUrl).toEqual(`${hostUrl}/courses/${course.id}?activeTab=tools`);
			expect(scopeInfo.scopeName).toEqual('courses');
		});

		it('should return scope info for teams', async () => {
			// Act
			const scopeInfo: IScopeInfo = await useCase.getScopeInfoSpec('userId', VideoConferenceScope.EVENT, eventId);

			// Assert
			expect(scopeInfo.scopeId).toEqual(event.teamId);
			expect(scopeInfo.title).toEqual(event.title);
			expect(scopeInfo.logoutUrl).toEqual(`${hostUrl}/teams/${event.teamId}?activeTab=events`);
			expect(scopeInfo.scopeName).toEqual('teams');
		});

		it('should throw on unknown scope', async () => {
			// Act & Assert
			await expect(
				useCase.getScopeInfoSpec('userId', 'unknown' as VideoConferenceScope, 'someScopeId')
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('checkPermission', () => {
		it('should return bbb moderator role', async () => {
			// Arrange
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, true);

			// Act
			const bbbRole: BBBRole = await useCase.checkPermissionSpec('userId', VideoConferenceScope.COURSE, 'entityId');

			// Assert
			expect(bbbRole).toEqual(BBBRole.MODERATOR);
		});

		it('should return bbb viewer role', async () => {
			// Arrange
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, false);

			// Act
			const bbbRole: BBBRole = await useCase.checkPermissionSpec('userId', VideoConferenceScope.COURSE, 'entityId');

			// Assert
			expect(bbbRole).toEqual(BBBRole.VIEWER);
		});

		it('should throw on missing permission', async () => {
			// Arrange
			userPermissions.set(Permission.JOIN_MEETING, false);
			userPermissions.set(Permission.START_MEETING, false);

			// Act & Assert
			await expect(useCase.checkPermissionSpec('userId', VideoConferenceScope.COURSE, 'entityId')).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	describe('throwOnFeaturesDisabled', () => {
		it('should succeed since all features are enabled', async () => {
			// Act & Assert
			await expect(useCase.throwOnFeaturesDisabledSpec('schoolId')).resolves.not.toThrow();
		});

		it('should throw on school feature disabled', async () => {
			// Arrange
			schoolUc.hasFeature.mockResolvedValue(false);

			// Act & Assert
			await expect(useCase.throwOnFeaturesDisabledSpec('schoolId')).rejects.toThrow(ForbiddenException);
		});

		it('should throw on global environment variable is not set', async () => {
			// Arrange
			featureEnabled = false;

			// Act & Assert
			await expect(useCase.throwOnFeaturesDisabledSpec('schoolId')).rejects.toThrow(ForbiddenException);
		});
	});

	describe('create', () => {
		let vcDO: VideoConferenceDO;
		let savedVcDO: VideoConferenceDO;
		let builder: BBBCreateConfigBuilder;
		let bbbResponse: BBBResponse<BBBCreateResponse>;

		beforeEach(() => {
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, true);

			vcDO = new VideoConferenceDO({
				target: course.id,
				targetModel: VideoConferenceScope.COURSE,
				options: defaultOptions,
			});
			savedVcDO = { ...vcDO };
			savedVcDO.id = 'videoConferenceId';
			builder = new BBBCreateConfigBuilder({
				name: course.name,
				meetingID: course.id,
			}).withLogoutUrl(`${hostUrl}/courses/${course.id}?activeTab=tools`);
			bbbResponse = { meetingID: course.id } as unknown as BBBResponse<BBBCreateResponse>;
		});

		it('should throw on insufficient permissions', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, false);

			// Act & Assert
			await expect(
				useCase.create(defaultCurrentUser, VideoConferenceScope.COURSE, course.id, defaultOptions)
			).rejects.toThrow(ForbiddenException);
		});

		it('should successfully execute and create a new preset in the database', async () => {
			// Arrange
			videoConferenceRepo.findByScopeId.mockImplementation(() => Promise.reject());
			videoConferenceRepo.create.mockReturnValue(savedVcDO);
			bbbService.create.mockResolvedValue(bbbResponse);

			// Act
			const result: VideoConferenceDTO<BBBCreateResponse> = await useCase.create(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id,
				defaultOptions
			);

			// Assert
			expect(videoConferenceRepo.create).toHaveBeenCalledWith(vcDO);
			expect(videoConferenceRepo.save).toHaveBeenCalled();
			expect(bbbService.create).toHaveBeenCalledWith(builder.build());

			expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
			expect(result.permission).toEqual(Permission.START_MEETING);
			expect(result.bbbResponse).toEqual(bbbResponse);
		});

		it('should successfully execute and read a preset from the database', async () => {
			// Arrange
			videoConferenceRepo.findByScopeId.mockResolvedValue(savedVcDO);
			bbbService.create.mockResolvedValue(bbbResponse);

			// Act
			const result: VideoConferenceDTO<BBBCreateResponse> = await useCase.create(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id,
				defaultOptions
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalled();
			expect(videoConferenceRepo.save).toHaveBeenCalled();
			expect(bbbService.create).toHaveBeenCalledWith(builder.build());

			expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
			expect(result.permission).toEqual(Permission.START_MEETING);
			expect(result.bbbResponse).toEqual(bbbResponse);
		});

		it('should successfully execute with options set', async () => {
			// Arrange
			videoConferenceRepo.findByScopeId.mockResolvedValue(savedVcDO);
			bbbService.create.mockResolvedValue(bbbResponse);
			builder.withGuestPolicy(GuestPolicy.ASK_MODERATOR);
			builder.withMuteOnStart(true);
			defaultOptions.moderatorMustApproveJoinRequests = true;
			defaultOptions.everyAttendeeJoinsMuted = true;

			// Act
			const result: VideoConferenceDTO<BBBCreateResponse> = await useCase.create(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id,
				defaultOptions
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalled();
			expect(videoConferenceRepo.save).toHaveBeenCalled();
			expect(bbbService.create).toHaveBeenCalledWith(builder.build());

			expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
			expect(result.permission).toEqual(Permission.START_MEETING);
			expect(result.bbbResponse).toEqual(bbbResponse);
		});
	});

	describe('join', () => {
		const joinUrl = 'joinUrl';

		let builderCourse: BBBJoinConfigBuilder;
		let builderEvent: BBBJoinConfigBuilder;
		let courseVcDO: VideoConferenceDO;
		let eventVcDO: VideoConferenceDO;
		let team: Team;
		let user: User;

		const defaultRole = roleFactory.build({ permissions: [Permission.JOIN_MEETING] });
		const expertRoleCourse = roleFactory.build({ name: RoleName.EXPERT, permissions: [Permission.JOIN_MEETING] });
		const expertRoleTeam = roleFactory.build({ name: RoleName.TEAMEXPERT, permissions: [Permission.JOIN_MEETING] });

		const setTeamRole = (role: Role) => {
			team.userIds[0].role = role;
			user.roles.set([role]);
			defaultCurrentUser.roles = [role.name];
		};

		beforeEach(() => {
			userPermissions.set(Permission.START_MEETING, false);

			team = teamFactory.withRoleAndUserId(defaultRole, defaultCurrentUser.userId).build();
			user = team.userIds[0].userId;
			user.firstName = 'firstName';
			user.lastName = 'lastName';

			builderCourse = new BBBJoinConfigBuilder({
				fullName: `${user.firstName} ${user.lastName}`,
				meetingID: course.id,
				role: BBBRole.VIEWER,
			}).withUserId(defaultCurrentUser.userId);
			builderEvent = new BBBJoinConfigBuilder({
				fullName: `${user.firstName} ${user.lastName}`,
				meetingID: eventId,
				role: BBBRole.VIEWER,
			}).withUserId(defaultCurrentUser.userId);
			courseVcDO = new VideoConferenceDO({
				target: course.id,
				targetModel: VideoConferenceScope.COURSE,
				options: defaultOptions,
			});
			eventVcDO = new VideoConferenceDO({
				target: eventId,
				targetModel: VideoConferenceScope.EVENT,
				options: defaultOptions,
			});

			userRepo.findById.mockResolvedValue(user);
		});

		it('should successfully return a join link for a viewer in courses', async () => {
			// Arrange
			videoConferenceRepo.findByScopeId.mockResolvedValue(courseVcDO);
			bbbService.join.mockResolvedValue(joinUrl);

			// Act
			const result: VideoConferenceJoinDTO = await useCase.join(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalledWith(course.id, VideoConferenceScope.COURSE);
			expect(bbbService.join).toHaveBeenCalledWith(builderCourse.build());
			expect(userRepo.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should successfully return a join link for a viewer in teams', async () => {
			// Arrange
			videoConferenceRepo.findByScopeId.mockResolvedValue(eventVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			teamsRepo.findById.mockResolvedValue(team);

			// Act
			const result: VideoConferenceJoinDTO = await useCase.join(
				defaultCurrentUser,
				VideoConferenceScope.EVENT,
				eventId
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalledWith(eventId, VideoConferenceScope.EVENT);
			expect(bbbService.join).toHaveBeenCalledWith(builderEvent.build());
			expect(userRepo.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);
			expect(teamsRepo.findById).toHaveBeenCalledWith(event.teamId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should successfully join as guest in courses', async () => {
			// Arrange
			setTeamRole(expertRoleCourse);
			videoConferenceRepo.findByScopeId.mockResolvedValue(courseVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			builderCourse.asGuest(true);

			// Act
			const result: VideoConferenceJoinDTO = await useCase.join(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalledWith(course.id, VideoConferenceScope.COURSE);
			expect(bbbService.join).toHaveBeenCalledWith(builderCourse.build());
			expect(userRepo.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should successfully join as guest in teams', async () => {
			// Arrange
			setTeamRole(expertRoleTeam);
			videoConferenceRepo.findByScopeId.mockResolvedValue(eventVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			teamsRepo.findById.mockResolvedValue(team);
			builderEvent.asGuest(true);

			// Act
			const result: VideoConferenceJoinDTO = await useCase.join(
				defaultCurrentUser,
				VideoConferenceScope.EVENT,
				eventId
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalledWith(eventId, VideoConferenceScope.EVENT);
			expect(bbbService.join).toHaveBeenCalledWith(builderEvent.build());
			expect(userRepo.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);
			expect(teamsRepo.findById).toHaveBeenCalledWith(event.teamId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should throw on unknown scope', async () => {
			// Act & Assert
			await expect(
				useCase.join(defaultCurrentUser, 'unknown scope' as VideoConferenceScope, course.id)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw on unknown team user', async () => {
			// Arrange
			teamsRepo.findById.mockResolvedValue(team);
			team.userIds = [];

			// Act & Assert
			await expect(useCase.join(defaultCurrentUser, VideoConferenceScope.EVENT, eventId)).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should always successfully join as moderator', async () => {
			// Arrange
			courseVcDO.options.everybodyJoinsAsModerator = true;
			videoConferenceRepo.findByScopeId.mockResolvedValue(courseVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			builderCourse.withRole(BBBRole.MODERATOR);

			// Act
			const result: VideoConferenceJoinDTO = await useCase.join(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id
			);

			// Assert
			expect(videoConferenceRepo.findByScopeId).toHaveBeenCalledWith(course.id, VideoConferenceScope.COURSE);
			expect(bbbService.join).toHaveBeenCalledWith(builderCourse.build());
			expect(userRepo.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});
	});

	describe('end', () => {
		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: course.id,
		});

		const bbbResponse: BBBResponse<BBBBaseResponse> = {
			response: {
				returncode: VideoConferenceStatus.SUCCESS,
				messageKey: 'test message key',
				message: 'test message',
			},
		};

		beforeEach(() => {
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, true);
		});

		it('should throw on insufficient permissions', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, false);

			// Act & Assert
			await expect(useCase.end(defaultCurrentUser, VideoConferenceScope.COURSE, course.id)).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should successfully end a meeting', async () => {
			// Arrange
			bbbService.end.mockResolvedValue(bbbResponse);

			// Act
			const result: VideoConferenceDTO<BBBBaseResponse> = await useCase.end(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				course.id
			);

			// Assert
			expect(bbbService.end).toHaveBeenCalledWith(config);

			expect(result.state).toEqual(VideoConferenceState.FINISHED);
			expect(result.permission).toEqual(Permission.START_MEETING);
			expect(result.bbbResponse).toEqual(bbbResponse);
		});
	});

	describe('getMeetingInfo', () => {
		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: course.id,
		});

		const bbbResponse: BBBResponse<BBBMeetingInfoResponse> = {
			response: {
				returncode: VideoConferenceStatus.SUCCESS,
				messageKey: 'test message key',
				message: 'test message',
			} as unknown as BBBMeetingInfoResponse,
		};

		let vcDO: VideoConferenceDO;

		beforeEach(() => {
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, true);

			vcDO = new VideoConferenceDO({
				target: course.id,
				targetModel: VideoConferenceScope.COURSE,
				options: defaultOptions,
			});

			videoConferenceRepo.findByScopeId.mockResolvedValue(vcDO);
		});

		it('should successfully give MeetingInfo to moderator with options', async () => {
			// Arrange
			bbbService.getMeetingInfo.mockResolvedValue(bbbResponse);

			// Act
			const result = await useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(bbbService.getMeetingInfo).toBeCalledWith(config);
			expect(result.bbbResponse).toEqual(bbbResponse);
			expect(result.options).toEqual(defaultOptions);
		});

		it('should successfully give MeetingInfo to viewer without options', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, false);
			bbbService.getMeetingInfo.mockResolvedValue(bbbResponse);

			// Act
			const result = await useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(bbbService.getMeetingInfo).toBeCalledWith(config);
			expect(result.bbbResponse).toEqual(bbbResponse);
			expect(result.options).toEqual({});
		});

		it('should successfully give MeetingInfo to moderator with default options and "not started"', async () => {
			// Arrange
			bbbService.getMeetingInfo.mockRejectedValue(new InternalServerErrorException());

			// Act
			const result = await useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(bbbService.getMeetingInfo).toBeCalledWith(config);
			expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
			expect(result.options).toEqual(defaultVideoConferenceOptions);
		});

		it('should successfully give MeetingInfo to viewer without options and "not started"', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, false);
			bbbService.getMeetingInfo.mockRejectedValue(new InternalServerErrorException());

			// Act
			const result = await useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(bbbService.getMeetingInfo).toBeCalledWith(config);
			expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
			expect(result.options).toEqual({});
		});
	});
});
