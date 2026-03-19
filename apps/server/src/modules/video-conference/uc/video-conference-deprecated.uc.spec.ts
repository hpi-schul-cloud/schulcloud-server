import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { CalendarEventDto, CalendarService } from '@infra/calendar';
import { AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { LegacySchoolService } from '@modules/legacy-school';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { TeamEntity, TeamRepo } from '@modules/team/repo';
import { teamFactory } from '@modules/team/testing';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory } from '@modules/user/testing';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { RoleReference } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import {
	BBBBaseMeetingConfig,
	BBBCreateConfigBuilder,
	BBBCreateResponse,
	BBBJoinConfigBuilder,
	BBBMeetingInfoResponse,
	BBBResponse,
	BBBRole,
	BBBService,
	BBBStatus,
	GuestPolicy,
} from '../bbb';
import { VideoConferenceDO, VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface';
import { VideoConferenceRepo } from '../repo';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from '../video-conference-config';
import { ScopeInfo, VideoConference, VideoConferenceState } from './dto';
import { VideoConferenceDeprecatedUc } from './video-conference-deprecated.uc';

class VideoConferenceDeprecatedUcSpec extends VideoConferenceDeprecatedUc {
	getScopeInfoSpec(
		userId: EntityId,
		conferenceScope: VideoConferenceScope,
		refId: string
	): Promise<{ scopeInfo: ScopeInfo; object: AuthorizableObject }> {
		return this.getScopeInfo(userId, conferenceScope, refId);
	}

	checkPermissionSpec(userId: EntityId, object: AuthorizableObject): Promise<BBBRole> {
		return this.checkPermission(userId, object);
	}

	throwOnFeaturesDisabledSpec(schoolId: EntityId): Promise<void> {
		return this.throwOnFeaturesDisabled(schoolId);
	}
}

describe('VideoConferenceUc', () => {
	let module: TestingModule;
	let useCase: VideoConferenceDeprecatedUcSpec;

	let bbbService: DeepMocked<BBBService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let videoConferenceRepo: DeepMocked<VideoConferenceRepo>;
	let teamRepo: DeepMocked<TeamRepo>;
	let courseService: DeepMocked<CourseService>;
	let userService: DeepMocked<UserService>;
	let calendarService: DeepMocked<CalendarService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let config: VideoConferenceConfig;

	const hostUrl = 'https://localhost:4000';
	const course: CourseEntity = { id: 'courseId', name: 'courseName' } as CourseEntity;
	const eventId = 'eventId';
	const event: CalendarEventDto = new CalendarEventDto({
		title: 'eventTitle',
		teamId: 'teamId',
	});
	let defaultCurrentUser: ICurrentUser;
	let defaultOptions: VideoConferenceOptions;
	const userPermissions: Map<Permission, Promise<boolean>> = new Map<Permission, Promise<boolean>>();

	let team: TeamEntity;
	let user: UserDo;

	let defaultRole: Role;
	let externalPersonRole: Role;
	let teamExpertRole: Role;

	const setTeamRole = (role: Role) => {
		team.teamUsers[0].role = role;
		user.roles = [new RoleReference({ id: role.id, name: role.name })];
		defaultCurrentUser.roles = [role.name];
	};

	beforeAll(async () => {
		await setupEntities([User, Role]);

		module = await Test.createTestingModule({
			providers: [
				VideoConferenceDeprecatedUcSpec,
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
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: CalendarService,
					useValue: createMock<CalendarService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: VIDEO_CONFERENCE_CONFIG_TOKEN,
					useValue: {
						scHostUrl: hostUrl,
						featureVideoConferenceEnabled: true,
					},
				},
			],
		}).compile();
		useCase = module.get(VideoConferenceDeprecatedUcSpec);
		schoolService = module.get(LegacySchoolService);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		calendarService = module.get(CalendarService);
		videoConferenceRepo = module.get(VideoConferenceRepo);
		userService = module.get(UserService);
		teamRepo = module.get(TeamRepo);
		bbbService = module.get(BBBService);
		config = module.get<VideoConferenceConfig>(VIDEO_CONFERENCE_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	beforeEach(() => {
		config.featureVideoConferenceEnabled = true;
		defaultCurrentUser = {
			userId: '0123456789abcdef01234567',
			roles: [],
			schoolId: 'schoolId',
			accountId: 'accountId',
			isExternalUser: false,
			support: false,
		};
		defaultOptions = {
			everybodyJoinsAsModerator: false,
			everyAttendeeJoinsMuted: false,
			moderatorMustApproveJoinRequests: false,
		};
		defaultRole = roleFactory.build({ permissions: [Permission.JOIN_MEETING] });
		externalPersonRole = roleFactory.build({ name: RoleName.EXTERNALPERSON, permissions: [Permission.JOIN_MEETING] });
		teamExpertRole = roleFactory.build({ name: RoleName.TEAMEXPERT, permissions: [Permission.JOIN_MEETING] });

		team = teamFactory.withRoleAndUserId(defaultRole, defaultCurrentUser.userId).build();
		user = userDoFactory.build({ id: defaultCurrentUser.userId, firstName: 'firstName', lastName: 'lastName' });

		userPermissions.set(Permission.JOIN_MEETING, Promise.resolve(true));
		userPermissions.set(Permission.START_MEETING, Promise.resolve(true));

		teamRepo.findById.mockResolvedValue(team);
		schoolService.hasFeature.mockResolvedValue(true);
		courseService.findById.mockResolvedValue(course);
		calendarService.findEvent.mockResolvedValue(event);
	});

	describe('getScopeInfo', () => {
		it('should return scope info for courses', async () => {
			// Act
			const result = await useCase.getScopeInfoSpec('userId', VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(result.scopeInfo.scopeId).toEqual(course.id);
			expect(result.scopeInfo.logoutUrl).toEqual(`${hostUrl}/courses/${course.id}?activeTab=tools`);
			expect(result.scopeInfo.scopeName).toEqual(VideoConferenceScope.COURSE);
			expect(result.scopeInfo.title).toEqual(course.name);
			expect(result.object).toEqual(course);
		});

		it('should return scope info for teams', async () => {
			// Act
			const result = await useCase.getScopeInfoSpec('userId', VideoConferenceScope.EVENT, eventId);

			// Assert
			expect(result.scopeInfo.scopeId).toEqual(event.teamId);
			expect(result.scopeInfo.title).toEqual(event.title);
			expect(result.scopeInfo.logoutUrl).toEqual(`${hostUrl}/teams/${event.teamId}?activeTab=events`);
			expect(result.scopeInfo.scopeName).toEqual(VideoConferenceScope.EVENT);
			expect(result.object).toEqual(team);
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
			authorizationService.hasPermission.mockReturnValueOnce(true);
			authorizationService.hasPermission.mockReturnValueOnce(false);
			// Act
			const bbbRole = await useCase.checkPermissionSpec('userId', course);

			// Assert
			expect(bbbRole).toEqual(BBBRole.MODERATOR);
		});

		it('should return bbb viewer role', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);

			// Act
			const bbbRole = await useCase.checkPermissionSpec('userId', course);

			// Assert
			expect(bbbRole).toEqual(BBBRole.VIEWER);
		});

		it('should throw on missing permission', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(false);

			// Act & Assert
			await expect(useCase.checkPermissionSpec('userId', course)).rejects.toThrow(
				new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION)
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
			schoolService.hasFeature.mockResolvedValue(false);

			// Act & Assert
			await expect(useCase.throwOnFeaturesDisabledSpec('schoolId')).rejects.toThrow(
				new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED)
			);
		});

		it('should throw on global environment variable is not set', async () => {
			// Arrange
			config.featureVideoConferenceEnabled = false;

			// Act & Assert
			await expect(useCase.throwOnFeaturesDisabledSpec('schoolId')).rejects.toThrow(
				new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED)
			);
		});
	});

	describe('create', () => {
		describe('when scope is course', () => {
			let vcDO: VideoConferenceDO;
			let savedVcDO: VideoConferenceDO;
			let builder: BBBCreateConfigBuilder;
			let bbbResponse: BBBResponse<BBBCreateResponse>;

			beforeEach(() => {
				userPermissions.set(Permission.JOIN_MEETING, Promise.resolve(true));
				userPermissions.set(Permission.START_MEETING, Promise.resolve(true));

				vcDO = new VideoConferenceDO({
					target: course.id,
					targetModel: VideoConferenceScope.COURSE,
					options: defaultOptions,
					salt: 'fixed-salt-for-testing',
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
				//	userPermissions.set(Permission.START_MEETING, Promise.resolve(false));
				authorizationService.hasPermission.mockReturnValueOnce(false);
				authorizationService.hasPermission.mockReturnValueOnce(true);

				// Act & Assert
				await expect(
					useCase.create(defaultCurrentUser, VideoConferenceScope.COURSE, course.id, defaultOptions)
				).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});

			it('should successfully execute and create a new preset in the database', async () => {
				// Arrange
				videoConferenceRepo.findByScopeAndScopeId.mockImplementation(() => Promise.reject());
				bbbService.create.mockResolvedValue(bbbResponse);

				// Act
				const result: VideoConference<BBBCreateResponse> = await useCase.create(
					defaultCurrentUser,
					VideoConferenceScope.COURSE,
					course.id,
					defaultOptions
				);

				// Assert
				expect(videoConferenceRepo.save).toHaveBeenCalledWith(
					new VideoConferenceDO({
						target: course.id,
						targetModel: VideoConferenceScope.COURSE,
						options: defaultOptions,
						salt: expect.any(String),
					})
				);
				expect(bbbService.create).toHaveBeenCalledWith(builder.withScDomain(hostUrl).build());

				expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
				expect(result.permission).toEqual(Permission.START_MEETING);
				expect(result.bbbResponse).toEqual(bbbResponse);
			});

			it('should successfully execute and read a preset from the database', async () => {
				// Arrange
				videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(savedVcDO);
				bbbService.create.mockResolvedValue(bbbResponse);

				// Act
				const result: VideoConference<BBBCreateResponse> = await useCase.create(
					defaultCurrentUser,
					VideoConferenceScope.COURSE,
					course.id,
					defaultOptions
				);

				// Assert
				expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalled();
				expect(videoConferenceRepo.save).toHaveBeenCalled();
				expect(bbbService.create).toHaveBeenCalledWith(builder.withScDomain(hostUrl).build());

				expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
				expect(result.permission).toEqual(Permission.START_MEETING);
				expect(result.bbbResponse).toEqual(bbbResponse);
			});

			it('should add salt to existing preset if missing', async () => {
				// Arrange
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				savedVcDO.salt = undefined;
				videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(savedVcDO);
				bbbService.create.mockResolvedValue(bbbResponse);

				// Act
				await useCase.create(defaultCurrentUser, VideoConferenceScope.COURSE, course.id, defaultOptions);

				// Assert
				expect(videoConferenceRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						salt: expect.any(String),
					})
				);
			});

			it('should successfully execute with options set', async () => {
				// Arrange
				videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(savedVcDO);
				bbbService.create.mockResolvedValue(bbbResponse);
				builder.withGuestPolicy(GuestPolicy.ASK_MODERATOR);
				builder.withMuteOnStart(true);
				defaultOptions.moderatorMustApproveJoinRequests = true;
				defaultOptions.everyAttendeeJoinsMuted = true;

				// Act
				const result: VideoConference<BBBCreateResponse> = await useCase.create(
					defaultCurrentUser,
					VideoConferenceScope.COURSE,
					course.id,
					defaultOptions
				);

				// Assert
				expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalled();
				expect(videoConferenceRepo.save).toHaveBeenCalled();
				expect(bbbService.create).toHaveBeenCalledWith(builder.withScDomain(hostUrl).build());

				expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
				expect(result.permission).toEqual(Permission.START_MEETING);
				expect(result.bbbResponse).toEqual(bbbResponse);
			});
		});

		describe('when user has no permission', () => {
			it('should throw on unknown scope', async () => {
				authorizationService.hasPermission.mockReturnValueOnce(false);
				authorizationService.hasPermission.mockReturnValueOnce(false);

				await expect(
					useCase.create(defaultCurrentUser, VideoConferenceScope.COURSE, course.id, defaultOptions)
				).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});
		});
	});

	describe('join', () => {
		const joinUrl = 'joinUrl';

		let builderCourse: BBBJoinConfigBuilder;
		let builderEvent: BBBJoinConfigBuilder;
		let courseVcDO: VideoConferenceDO;
		let eventVcDO: VideoConferenceDO;

		beforeEach(() => {
			userPermissions.set(Permission.START_MEETING, Promise.resolve(false));

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
				salt: 'fixed-salt-for-testing',
			});
			eventVcDO = new VideoConferenceDO({
				target: eventId,
				targetModel: VideoConferenceScope.EVENT,
				options: defaultOptions,
				salt: 'fixed-salt-for-testing',
			});

			userService.findById.mockResolvedValue(user);
		});

		it('should successfully return a join link for a viewer in courses', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(courseVcDO);
			bbbService.join.mockResolvedValue(joinUrl);

			// Act
			const result = await useCase.join(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(course.id, VideoConferenceScope.COURSE);
			expect(bbbService.join).toHaveBeenCalledWith(builderCourse.build());
			expect(userService.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should successfully return a join link for a viewer in teams', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(eventVcDO);
			bbbService.join.mockResolvedValue(joinUrl);

			// Act
			const result = await useCase.join(defaultCurrentUser, VideoConferenceScope.EVENT, eventId);

			// Assert
			expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(eventId, VideoConferenceScope.EVENT);
			expect(bbbService.join).toHaveBeenCalledWith(builderEvent.build());
			expect(userService.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);
			expect(teamRepo.findById).toHaveBeenCalledWith(event.teamId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should successfully join as guest in courses, without moderator rights', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
			courseVcDO.options.everybodyJoinsAsModerator = true;
			courseVcDO.options.moderatorMustApproveJoinRequests = true;
			setTeamRole(externalPersonRole);
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(courseVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			builderCourse.asGuest(true);

			// Act
			const result = await useCase.join(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(course.id, VideoConferenceScope.COURSE);
			expect(bbbService.join).toHaveBeenCalledWith(builderCourse.build());
			expect(userService.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should successfully join as guest in teams, without moderator rights', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
			courseVcDO.options.everybodyJoinsAsModerator = true;
			courseVcDO.options.moderatorMustApproveJoinRequests = true;
			setTeamRole(teamExpertRole);
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(eventVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			builderEvent.asGuest(true);

			// Act
			const result = await useCase.join(defaultCurrentUser, VideoConferenceScope.EVENT, eventId);

			// Assert
			expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(eventId, VideoConferenceScope.EVENT);
			expect(bbbService.join).toHaveBeenCalledWith(builderEvent.build());
			expect(userService.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);
			expect(teamRepo.findById).toHaveBeenCalledWith(event.teamId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});

		it('should throw when joining as guest without waiting room', async () => {
			// Arrange
			courseVcDO.options.moderatorMustApproveJoinRequests = false;
			setTeamRole(teamExpertRole);
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(eventVcDO);
			bbbService.join.mockResolvedValue(joinUrl);

			// Act & Assert
			await expect(useCase.join(defaultCurrentUser, VideoConferenceScope.EVENT, eventId)).rejects.toThrow(
				new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE)
			);
		});

		it('should throw on unknown scope', async () => {
			// Act & Assert
			await expect(
				useCase.join(defaultCurrentUser, 'unknown scope' as VideoConferenceScope, course.id)
			).rejects.toThrow(BadRequestException);
		});

		it('should throw on unknown team user', async () => {
			// Arrange
			team.teamUsers = [];

			// Act & Assert
			await expect(useCase.join(defaultCurrentUser, VideoConferenceScope.EVENT, eventId)).rejects.toThrow(
				new ForbiddenException(ErrorStatus.UNKNOWN_USER)
			);
		});

		it('should always successfully join as moderator', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
			courseVcDO.options.everybodyJoinsAsModerator = true;
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(courseVcDO);
			bbbService.join.mockResolvedValue(joinUrl);
			builderCourse.withRole(BBBRole.MODERATOR);

			// Act
			const result = await useCase.join(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(course.id, VideoConferenceScope.COURSE);
			expect(bbbService.join).toHaveBeenCalledWith(builderCourse.build());
			expect(userService.findById).toHaveBeenCalledWith(defaultCurrentUser.userId);

			expect(result.state).toEqual(VideoConferenceState.RUNNING);
			expect(result.permission).toEqual(Permission.JOIN_MEETING);
			expect(result.url).toEqual(joinUrl);
		});
	});

	describe('end', () => {
		const config = new BBBBaseMeetingConfig({
			meetingID: course.id,
		});

		const bbbResponse = {
			response: {
				returncode: BBBStatus.SUCCESS,
				messageKey: 'test message key',
				message: 'test message',
			},
		};

		it('should throw on insufficient permissions', async () => {
			// Arrange
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);

			// Act & Assert
			await expect(useCase.end(defaultCurrentUser, VideoConferenceScope.COURSE, course.id)).rejects.toThrow(
				new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION)
			);
		});

		it('should successfully end a meeting', async () => {
			// Arrange
			bbbService.end.mockResolvedValue(bbbResponse);

			// Act
			const result = await useCase.end(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(bbbService.end).toHaveBeenCalledWith(config);

			expect(result.state).toEqual(VideoConferenceState.FINISHED);
			expect(result.permission).toEqual(Permission.START_MEETING);
			expect(result.bbbResponse).toEqual(bbbResponse);
		});
	});

	describe('getMeetingInfo', () => {
		const config = new BBBBaseMeetingConfig({
			meetingID: course.id,
		});

		const bbbResponse = {
			response: {
				returncode: BBBStatus.SUCCESS,
				messageKey: 'test message key',
				message: 'test message',
			} as unknown as BBBMeetingInfoResponse,
		};

		let vcDO: VideoConferenceDO;

		beforeEach(() => {
			vcDO = new VideoConferenceDO({
				target: course.id,
				targetModel: VideoConferenceScope.COURSE,
				options: defaultOptions,
				salt: 'fixed-salt-for-testing',
			});

			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(vcDO);
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
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
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
			videoConferenceRepo.findByScopeAndScopeId.mockImplementation(() => Promise.reject());
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
			authorizationService.hasPermission.mockReturnValueOnce(false);
			authorizationService.hasPermission.mockReturnValueOnce(true);
			bbbService.getMeetingInfo.mockRejectedValue(new InternalServerErrorException());

			// Act
			const result = await useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.COURSE, course.id);

			// Assert
			expect(bbbService.getMeetingInfo).toBeCalledWith(config);
			expect(result.state).toEqual(VideoConferenceState.NOT_STARTED);
			expect(result.options).toEqual({});
		});

		it('should throw forbidden, when called as guest without waiting room', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, Promise.resolve(false));
			setTeamRole(teamExpertRole);
			vcDO.options.moderatorMustApproveJoinRequests = false;
			bbbService.getMeetingInfo.mockResolvedValue(bbbResponse);
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(vcDO);

			// Act & Assert
			await expect(useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.EVENT, course.id)).rejects.toThrow(
				new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE)
			);
		});

		it('should throw forbidden, when called as guest and meeting is not started yet', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, Promise.resolve(false));
			setTeamRole(teamExpertRole);
			bbbService.getMeetingInfo.mockImplementation(() => Promise.reject());

			// Act & Assert
			await expect(useCase.getMeetingInfo(defaultCurrentUser, VideoConferenceScope.EVENT, course.id)).rejects.toThrow(
				new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE)
			);
		});
	});
});
