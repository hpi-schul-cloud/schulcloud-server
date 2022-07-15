import { Test, TestingModule } from '@nestjs/testing';
import { BBBService } from '@src/modules/video-conference/service/bbb.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IScopeInfo, VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { AuthorizationService } from '@src/modules';
import { CourseRepo, TeamsRepo, UserRepo, VideoConferenceRepo } from '@shared/repo';
import { CalendarService, ICalendarEvent } from '@shared/infra/calendar';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import { Course, EntityId, ICurrentUser, IResolvedUser, Permission, VideoConferenceDO } from '@shared/domain';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { VideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';
import { VideoConferenceDTO } from '@src/modules/video-conference/dto/video-conference.dto';
import { BBBCreateResponse } from '@src/modules/video-conference/interface/bbb-response.interface';
import { BBBCreateConfig } from '@src/modules/video-conference/config/bbb-create.config';

class VideoConferenceUcSpec extends VideoConferenceUc {
	async getScopeInfoSpec(userId: EntityId, conferenceScope: VideoConferenceScope, refId: string): Promise<IScopeInfo> {
		return this.getScopeInfo(userId, conferenceScope, refId);
	}

	async checkPermissionSpec(userId: EntityId, entityId: EntityId): Promise<BBBRole> {
		return this.checkPermission(userId, entityId);
	}

	async throwOnFeaturesDisabledSpec(schoolId: EntityId): Promise<void> {
		return this.throwOnFeaturesDisabled(schoolId);
	}
}

describe('VideoConferenceUc', () => {
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
	const event: ICalendarEvent = {
		title: 'eventTitle',
		'x-sc-teamId': 'teamId',
	};
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
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	beforeEach(() => {
		featureEnabled = true;
		defaultCurrentUser = {
			userId: 'userId',
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
		userPermissions.clear();

		schoolUc.hasFeature.mockResolvedValue(true);
		courseRepo.findById.mockResolvedValue(course);
		calendarService.findEvent.mockResolvedValue(event);
		authorizationService.hasPermissionsByReferences.mockResolvedValue(userPermissions); // TODO mock this
	});

	afterEach(() => {
		jest.resetAllMocks();
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
			const scopeInfo: IScopeInfo = await useCase.getScopeInfoSpec('userId', VideoConferenceScope.EVENT, 'eventId');

			// Assert
			expect(scopeInfo.scopeId).toEqual(event['x-sc-teamId']);
			expect(scopeInfo.title).toEqual(event.title);
			expect(scopeInfo.logoutUrl).toEqual(`${hostUrl}/teams/${event['x-sc-teamId']}?activeTab=events`);
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
			const bbbRole: BBBRole = await useCase.checkPermissionSpec('userId', 'entityId');

			// Assert
			expect(bbbRole).toEqual(BBBRole.MODERATOR);
		});

		it('should return bbb viewer role', async () => {
			// Arrange
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, false);

			// Act
			const bbbRole: BBBRole = await useCase.checkPermissionSpec('userId', 'entityId');

			// Assert
			expect(bbbRole).toEqual(BBBRole.VIEWER);
		});

		it('should throw on missing permission', async () => {
			// Arrange
			userPermissions.set(Permission.JOIN_MEETING, false);
			userPermissions.set(Permission.START_MEETING, false);

			// Act & Assert
			await expect(useCase.checkPermissionSpec('userId', 'entityId')).rejects.toThrow(ForbiddenException);
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
		beforeEach(() => {
			userPermissions.set(Permission.JOIN_MEETING, true);
			userPermissions.set(Permission.START_MEETING, true);
		});

		it('should throw on insufficient permissions', async () => {
			// Arrange
			userPermissions.set(Permission.START_MEETING, false);

			// Act & Assert
			await expect(
				useCase.create(defaultCurrentUser, VideoConferenceScope.COURSE, 'courseId', defaultOptions)
			).rejects.toThrow(ForbiddenException);
		});

		it('should successfully execute and create a new database entry', async () => {
			// Arrange
			const courseId = 'courseId';
			const vcDO: VideoConferenceDO = new VideoConferenceDO({
				target: courseId,
				targetModel: VideoConferenceScope.COURSE,
				options: defaultOptions,
			});

			const savedVcDO: VideoConferenceDO = { ...vcDO };
			savedVcDO.id = 'videoConferenceId';

			const config: BBBCreateConfig = {
				name: 'videoConferenceTitle',
				meetingID: 'meetingId',
			};

			videoConferenceRepo.findByScopeId.mockImplementation(() => Promise.reject());
			videoConferenceRepo.create.mockReturnValue(savedVcDO);

			// Act
			const result: VideoConferenceDTO<BBBCreateResponse> = await useCase.create(
				defaultCurrentUser,
				VideoConferenceScope.COURSE,
				courseId,
				defaultOptions
			);

			// Assert
			expect(videoConferenceRepo.create).toHaveBeenCalledWith(vcDO);
			expect(videoConferenceRepo.save).toHaveBeenCalled();
			expect(bbbService.create).toHaveBeenCalledWith(config);
		});
	});

	describe('join', () => {});

	describe('end', () => {});

	describe('getMeetingInfo', () => {});
});
