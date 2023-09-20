import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
	Course,
	EntityId,
	Permission,
	RoleName,
	SchoolFeatures,
	TeamUserEntity,
	UserDO,
	VideoConferenceDO,
	VideoConferenceScope,
} from '@shared/domain';
import { CalendarEventDto, CalendarService } from '@shared/infra/calendar';
import { TeamsRepo, VideoConferenceRepo } from '@shared/repo';
import {
	AuthorizableReferenceType,
	AuthorizationContextBuilder,
	AuthorizationService,
} from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { UserService } from '@src/modules/user';
import { courseFactory, roleFactory, setupEntities, userDoFactory } from '@shared/testing';
import { videoConferenceDOFactory } from '@shared/testing/factory/video-conference.do.factory';
import { ObjectId } from 'bson';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { CourseService } from '@src/modules/learnroom/service';
import { VideoConferenceService } from './video-conference.service';
import { ErrorStatus } from '../error/error-status.enum';
import { BBBRole } from '../bbb';
import { IScopeInfo, ScopeRef, VideoConferenceState } from '../uc/dto';
import { IVideoConferenceSettings, VideoConferenceOptions, VideoConferenceSettings } from '../interface';

describe('VideoConferenceService', () => {
	let service: DeepMocked<VideoConferenceService>;
	let courseService: DeepMocked<CourseService>;
	let calendarService: DeepMocked<CalendarService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let userService: DeepMocked<UserService>;
	let videoConferenceRepo: DeepMocked<VideoConferenceRepo>;
	let videoConferenceSettings: DeepMocked<IVideoConferenceSettings>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				VideoConferenceService,
				{
					provide: VideoConferenceSettings,
					useValue: createMock<IVideoConferenceSettings>({
						hostUrl: 'https://api.example.com',
					}),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: CalendarService,
					useValue: createMock<CalendarService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: VideoConferenceRepo,
					useValue: createMock<VideoConferenceRepo>(),
				},
			],
		}).compile();

		service = module.get(VideoConferenceService);
		courseService = module.get(CourseService);
		calendarService = module.get(CalendarService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);
		teamsRepo = module.get(TeamsRepo);
		userService = module.get(UserService);
		videoConferenceRepo = module.get(VideoConferenceRepo);
		videoConferenceSettings = module.get(VideoConferenceSettings);

		await setupEntities();
	});

	describe('canGuestJoin', () => {
		const setup = (isGuest: boolean, state: VideoConferenceState, waitingRoomEnabled: boolean) => {
			return {
				isGuest,
				state,
				waitingRoomEnabled,
			};
		};

		it('should return false if isGuest is true and state is NOT_STARTED', () => {
			const { isGuest, state, waitingRoomEnabled } = setup(true, VideoConferenceState.NOT_STARTED, true);

			const result = service.canGuestJoin(isGuest, state, waitingRoomEnabled);

			expect(result).toBe(false);
		});

		it('should return false if isGuest is true and waitingRoomEnabled is false', () => {
			const { isGuest, state, waitingRoomEnabled } = setup(true, VideoConferenceState.RUNNING, false);

			const result = service.canGuestJoin(isGuest, state, waitingRoomEnabled);

			expect(result).toBe(false);
		});

		it('should return true if isGuest is false and state is STARTED', () => {
			const { isGuest, state, waitingRoomEnabled } = setup(false, VideoConferenceState.RUNNING, true);

			const result = service.canGuestJoin(isGuest, state, waitingRoomEnabled);

			expect(result).toBe(true);
		});

		it('should return true if isGuest is true and waitingRoomEnabled is true', () => {
			const { isGuest, state, waitingRoomEnabled } = setup(true, VideoConferenceState.RUNNING, true);

			const result = service.canGuestJoin(isGuest, state, waitingRoomEnabled);

			expect(result).toBe(true);
		});
	});

	describe('isExpert', () => {
		describe('when user has EXPERT role for a course conference', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXPERT }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				userService.findById.mockResolvedValue(user);

				return {
					user,
					userId,
					conferenceScope: VideoConferenceScope.COURSE,
					scopeId,
				};
			};

			it('should return true', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				const result = await service.hasExpertRole(userId, conferenceScope, scopeId);

				expect(result).toBe(true);
			});

			it('should call userService.findById', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				await service.hasExpertRole(userId, conferenceScope, scopeId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});
		});

		describe('when user does not have the EXPERT role for a course conference', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.buildWithId();
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				userService.findById.mockResolvedValue(user);

				return {
					userId,
					scopeId,
				};
			};

			it('should return false', async () => {
				const { userId, scopeId } = setup();

				const result = await service.hasExpertRole(userId, VideoConferenceScope.COURSE, scopeId);

				expect(result).toBe(false);
				expect(userService.findById).toHaveBeenCalledWith(userId);
			});
		});

		describe('when conference scope is unknown', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.buildWithId();
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				userService.findById.mockResolvedValue(user);

				return {
					userId,
					scopeId,
				};
			};

			it('should throw a BadRequestException', async () => {
				const { userId, scopeId } = setup();

				const func = async () => service.hasExpertRole(userId, 'invalid-scope' as VideoConferenceScope, scopeId);

				await expect(func()).rejects.toThrow(new BadRequestException('Unknown scope name.'));
			});
		});

		describe('when user has EXPERT role for a event conference', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXPERT }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				const teamUser: TeamUserEntity = teamUserFactory.withRoleAndUserId(roleFactory.buildWithId(), userId).build();
				const team = teamFactory
					.withTeamUser([teamUser])
					.withRoleAndUserId(roleFactory.buildWithId({ name: RoleName.TEAMEXPERT }), userId)
					.build();
				teamsRepo.findById.mockResolvedValue(team);

				userService.findById.mockResolvedValue(user);

				return {
					user,
					userId,
					conferenceScope: VideoConferenceScope.EVENT,
					scopeId,
				};
			};

			it('should return true', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				const result = await service.hasExpertRole(userId, conferenceScope, scopeId);

				expect(result).toBe(true);
			});

			it('should call teamsRepo.findById', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				await service.hasExpertRole(userId, conferenceScope, scopeId);

				expect(teamsRepo.findById).toHaveBeenCalledWith(scopeId);
			});
		});

		describe('when user does not exist in team', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();
				const team = teamFactory.withRoleAndUserId(roleFactory.buildWithId(), userId).build({ teamUsers: [] });
				teamsRepo.findById.mockResolvedValue(team);

				return {
					user,
					userId,
					scopeId,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { scopeId } = setup();

				const func = async () => service.hasExpertRole('nonexistentUserId', VideoConferenceScope.EVENT, scopeId);

				await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.UNKNOWN_USER));
			});
		});
	});

	describe('checkPermission', () => {
		const setup = () => {
			const userId = 'user-id';
			const conferenceScope = VideoConferenceScope.COURSE;
			const entityId = 'entity-id';

			return {
				userId,
				conferenceScope,
				entityId,
			};
		};

		describe('when user has START_MEETING permission', () => {
			it('should return BBBRole.MODERATOR', async () => {
				const { userId, conferenceScope, entityId } = setup();

				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(true);
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(false);

				const result: BBBRole = await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(result).toBe(BBBRole.MODERATOR);
				expect(authorizationService.hasPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.Course,
					entityId,
					AuthorizationContextBuilder.read([Permission.START_MEETING])
				);
			});
		});

		describe('when user has JOIN_MEETING permission', () => {
			it('should return BBBRole.VIEWER', async () => {
				const { userId, conferenceScope, entityId } = setup();
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(false);
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(true);

				const result: BBBRole = await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(result).toBe(BBBRole.VIEWER);
				expect(authorizationService.hasPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.Course,
					entityId,
					AuthorizationContextBuilder.read([Permission.JOIN_MEETING])
				);
			});
		});

		describe('when user has neither START_MEETING nor JOIN_MEETING permission', () => {
			it('should throw a ForbiddenException', async () => {
				const { userId, conferenceScope, entityId } = setup();
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(false);
				authorizationService.hasPermissionByReferences.mockResolvedValueOnce(false);

				const func = () => service.determineBbbRole(userId, entityId, conferenceScope);

				await expect(func).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});
		});
	});

	describe('throwOnFeaturesDisabled', () => {
		const setup = (schoolFeatureEnabled = true) => {
			schoolService.hasFeature.mockResolvedValueOnce(schoolFeatureEnabled);
			const schoolId = 'school-id';

			return {
				schoolId,
			};
		};

		describe('when video conference feature is globally disabled', () => {
			it('should throw a ForbiddenException', async () => {
				const { schoolId } = setup(false);
				videoConferenceSettings.enabled = false;

				const func = () => service.throwOnFeaturesDisabled(schoolId);

				await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED));
			});
		});

		describe('when video conference feature is disabled for the school', () => {
			it('should throw a ForbiddenException', async () => {
				const { schoolId } = setup(false);

				const func = () => service.throwOnFeaturesDisabled(schoolId);

				await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED));
				expect(schoolService.hasFeature).toHaveBeenCalledWith(schoolId, SchoolFeatures.VIDEOCONFERENCE);
			});
		});

		describe('when video conference feature is enabled for the school', () => {
			it('should not throw an exception', async () => {
				schoolService.hasFeature.mockResolvedValue(true);
				const { schoolId } = setup();

				const func = () => service.throwOnFeaturesDisabled(schoolId);

				await expect(func()).resolves.toBeUndefined();
				expect(schoolService.hasFeature).toHaveBeenCalledWith(schoolId, SchoolFeatures.VIDEOCONFERENCE);
			});
		});
	});

	describe('sanitizeString', () => {
		it('should sanitize the string by removing special characters', () => {
			const text = 'Hello123!@#$%^&*()';

			const result = service.sanitizeString(text);

			expect(result).toBe('Hello123');
		});
	});

	describe('getScopeInfo', () => {
		const setup = () => {
			const userId = 'user-id';
			const conferenceScope: VideoConferenceScope = VideoConferenceScope.COURSE;
			const scopeId = new ObjectId().toHexString();

			return {
				userId,
				conferenceScope,
				scopeId,
			};
		};

		describe('when conference scope is VideoConferenceScope.COURSE', () => {
			it('should return scope information for a course', async () => {
				const { userId, conferenceScope, scopeId } = setup();
				const course: Course = courseFactory.buildWithId({ name: 'Course' });
				course.id = scopeId;
				courseService.findById.mockResolvedValue(course);

				const result: IScopeInfo = await service.getScopeInfo(userId, scopeId, conferenceScope);

				expect(result).toEqual({
					scopeId,
					scopeName: 'courses',
					logoutUrl: `${service.hostUrl}/courses/${scopeId}?activeTab=tools`,
					title: course.name,
				});
				expect(courseService.findById).toHaveBeenCalledWith(scopeId);
			});
		});

		describe('when conference scope is VideoConferenceScope.EVENT', () => {
			it('should return scope information for a event', async () => {
				const { userId, scopeId } = setup();
				const teamId = 'team-id';
				const event: CalendarEventDto = { title: 'Event', teamId };
				calendarService.findEvent.mockResolvedValue(event);

				const result: IScopeInfo = await service.getScopeInfo(userId, scopeId, VideoConferenceScope.EVENT);

				expect(result).toEqual({
					scopeId: teamId,
					scopeName: 'teams',
					logoutUrl: `${service.hostUrl}/teams/${teamId}?activeTab=events`,
					title: event.title,
				});
				expect(calendarService.findEvent).toHaveBeenCalledWith(userId, scopeId);
			});
		});

		describe('when conference scope is unknown', () => {
			it('should throw a BadRequestException for an unknown conference scope', async () => {
				const { userId, scopeId } = setup();

				const func = () => service.getScopeInfo(userId, scopeId, 'bad-scope' as VideoConferenceScope);

				await expect(func()).rejects.toThrow(new BadRequestException('Unknown scope name'));
			});
		});
	});

	describe('getUserRoleAndGuestStatusByUserId', () => {
		const setup = (conferenceScope: VideoConferenceScope) => {
			const user: UserDO = userDoFactory.buildWithId();
			const userId = user.id as EntityId;
			const scopeId = new ObjectId().toHexString();
			const team = teamFactory
				.withRoleAndUserId(roleFactory.build({ name: RoleName.EXPERT }), new ObjectId().toHexString())
				.build();

			return {
				user,
				userId,
				conferenceScope,
				scopeId,
				team,
			};
		};

		describe('when conference scope is VideoConferenceScope.COURSE', () => {
			it('should call courseRepo.findById', async () => {
				const { user, userId, conferenceScope, scopeId } = setup(VideoConferenceScope.COURSE);
				userService.findById.mockResolvedValue(user);

				await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(courseService.findById).toHaveBeenCalledWith(scopeId);
			});

			it('should call userService.findById', async () => {
				const { user, userId, conferenceScope, scopeId } = setup(VideoConferenceScope.COURSE);
				userService.findById.mockResolvedValue(user);

				await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should return the user role and guest status for a course conference', async () => {
				const { user, userId, conferenceScope, scopeId } = setup(VideoConferenceScope.COURSE);
				courseService.findById.mockResolvedValue(courseFactory.buildWithId({ name: 'Course' }));
				userService.findById.mockResolvedValue(user);

				const result = await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(result).toEqual({ role: BBBRole.MODERATOR, isGuest: false });
			});
		});

		describe('when conference scope is VideoConferenceScope.EVENT', () => {
			it('should throw a ForbiddenException if the user is not an expert for an event conference', async () => {
				const { userId, scopeId, team } = setup(VideoConferenceScope.EVENT);
				teamsRepo.findById.mockResolvedValue(team);

				const func = () => service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, VideoConferenceScope.EVENT);

				await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.UNKNOWN_USER));
			});
		});
	});

	describe('findVideoConferenceByScopeAndScopeId', () => {
		const setup = () => {
			const videoConference: VideoConferenceDO = videoConferenceDOFactory.build({
				id: 'video-conference-id',
				target: 'scopeId',
				targetModel: VideoConferenceScope.COURSE,
			});
			videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(videoConference);

			return {
				videoConference,
			};
		};

		describe('when the scope and scope ID are valid', () => {
			it('should call videoConferenceRepo.findByScopeAndScopeId', async () => {
				const { videoConference } = setup();

				await service.findVideoConferenceByScopeIdAndScope(videoConference.target, videoConference.targetModel);

				expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(
					videoConference.target,
					videoConference.targetModel
				);
			});

			it('should return the video conference', async () => {
				const { videoConference } = setup();

				const result: VideoConferenceDO = await service.findVideoConferenceByScopeIdAndScope(
					videoConference.target,
					videoConference.targetModel
				);

				expect(result).toBe(videoConference);
			});
		});
	});

	describe('createOrUpdateVideoConferenceWithOptions', () => {
		describe('when video conference exists', () => {
			const setup = () => {
				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });
				const scope: ScopeRef = { id: videoConference.target, scope: videoConference.targetModel };

				return {
					options,
					scope,
					videoConference,
				};
			};

			it('should call videoConferenceRepo.findByScopeAndScopeId', async () => {
				const { scope, options } = setup();

				await service.createOrUpdateVideoConferenceForScopeWithOptions(scope.id, scope.scope, options);

				expect(videoConferenceRepo.findByScopeAndScopeId).toHaveBeenCalledWith(scope.id, scope.scope);
			});

			it('should call videoConferenceRepo.save', async () => {
				const { videoConference, scope, options } = setup();
				videoConferenceRepo.save.mockResolvedValue(videoConference);

				await service.createOrUpdateVideoConferenceForScopeWithOptions(scope.id, scope.scope, options);

				expect(videoConferenceRepo.save).toHaveBeenCalledWith(videoConference);
			});
		});

		describe('when options are not provided', () => {
			const setup = () => {
				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference: VideoConferenceDO = videoConferenceDOFactory.build({ options });
				const scope: ScopeRef = { id: videoConference.target, scope: videoConference.targetModel };

				const newOptions: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: false,
					everybodyJoinsAsModerator: false,
					moderatorMustApproveJoinRequests: false,
				};

				videoConferenceRepo.findByScopeAndScopeId.mockResolvedValue(videoConference);
				videoConferenceRepo.save.mockResolvedValue(videoConference);

				return {
					scope,
					videoConference,
					newOptions,
				};
			};

			it('should return the updated video conference with new options', async () => {
				const { videoConference, scope, newOptions } = setup();

				const result: VideoConferenceDO = await service.createOrUpdateVideoConferenceForScopeWithOptions(
					scope.id,
					scope.scope,
					newOptions
				);

				expect(result).toEqual({ ...videoConference, options: newOptions });
			});
		});

		describe('when video conference does not exist', () => {
			const setup = () => {
				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference: VideoConferenceDO = videoConferenceDOFactory.build({ options });
				const scope: ScopeRef = { id: videoConference.target, scope: videoConference.targetModel };

				return {
					videoConference,
					options,
					scope,
				};
			};

			it('should create a new video conference', async () => {
				const { videoConference, scope, options } = setup();
				videoConferenceRepo.findByScopeAndScopeId.mockRejectedValue(new NotFoundException());
				videoConferenceRepo.save.mockResolvedValue(videoConference);

				const result: VideoConferenceDO = await service.createOrUpdateVideoConferenceForScopeWithOptions(
					scope.id,
					scope.scope,
					options
				);

				expect(result).toEqual(videoConference);
			});
		});
	});
});
