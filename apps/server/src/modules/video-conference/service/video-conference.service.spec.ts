import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CalendarEventDto, CalendarService } from '@infra/calendar';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/learnroom/service';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO, VideoConferenceDO } from '@shared/domain/domainobject';
import { Course, TeamUserEntity } from '@shared/domain/entity';
import { Permission, RoleName, VideoConferenceScope } from '@shared/domain/interface';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { TeamsRepo, VideoConferenceRepo } from '@shared/repo';
import { courseFactory, roleFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing/factory';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { videoConferenceDOFactory } from '@shared/testing/factory/video-conference.do.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { BBBRole } from '../bbb';
import { ErrorStatus } from '../error';
import { IVideoConferenceSettings, VideoConferenceOptions, VideoConferenceSettings } from '../interface';
import { ScopeInfo, ScopeRef, VideoConferenceState } from '../uc/dto';
import { VideoConferenceService } from './video-conference.service';

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

			it('should call the user service to find the user by id', async () => {
				const { userId, scopeId } = setup();

				await service.hasExpertRole(userId, VideoConferenceScope.COURSE, scopeId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should return false', async () => {
				const { userId, scopeId } = setup();

				const result = await service.hasExpertRole(userId, VideoConferenceScope.COURSE, scopeId);

				expect(result).toBe(false);
			});
		});

		describe('when user has the EXPERT role and an additional role for a course conference', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([
						{ id: new ObjectId().toHexString(), name: RoleName.STUDENT },
						{ id: new ObjectId().toHexString(), name: RoleName.EXPERT },
					])
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
		describe('when user has START_MEETING permission and is in course scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const entity = courseFactory.buildWithId();
				const conferenceScope = VideoConferenceScope.COURSE;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(false);
				courseService.findById.mockResolvedValueOnce(entity);

				return {
					user,
					userId: user.id,
					entity,
					entityId: entity.id,
					conferenceScope,
				};
			};

			it('should call the correct authorization order', async () => {
				const { user, entity, userId, conferenceScope, entityId } = setup();

				await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(authorizationService.hasPermission).toHaveBeenCalledWith(
					user,
					entity,
					AuthorizationContextBuilder.read([Permission.START_MEETING])
				);
			});

			it('should return BBBRole.MODERATOR', async () => {
				const { userId, conferenceScope, entityId } = setup();

				const result = await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(result).toBe(BBBRole.MODERATOR);
			});
		});

		// can be removed when team / course / user is passed from UC
		// missing when course / team loading throw an error, but also not nessasary if it is passed to UC.
		describe('when user has START_MEETING permission and is in team(event) scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const entity = teamFactory.buildWithId();
				const conferenceScope = VideoConferenceScope.EVENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(true).mockReturnValueOnce(false);
				teamsRepo.findById.mockResolvedValueOnce(entity);

				return {
					user,
					userId: user.id,
					entity,
					entityId: entity.id,
					conferenceScope,
				};
			};

			it('should call the correct authorization order', async () => {
				const { user, entity, userId, conferenceScope, entityId } = setup();

				await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(authorizationService.hasPermission).toHaveBeenCalledWith(
					user,
					entity,
					AuthorizationContextBuilder.read([Permission.START_MEETING])
				);
			});

			it('should return BBBRole.MODERATOR', async () => {
				const { userId, conferenceScope, entityId } = setup();

				const result = await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(result).toBe(BBBRole.MODERATOR);
			});
		});

		describe('when user has JOIN_MEETING permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const entity = courseFactory.buildWithId();
				const conferenceScope = VideoConferenceScope.COURSE;

				authorizationService.hasPermission.mockReturnValueOnce(false).mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findById.mockResolvedValueOnce(entity);

				return {
					user,
					userId: user.id,
					entity,
					entityId: entity.id,
					conferenceScope,
				};
			};

			it('should call the correct authorization order', async () => {
				const { user, entity, userId, conferenceScope, entityId } = setup();

				await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(authorizationService.hasPermission).toHaveBeenNthCalledWith(
					1,
					user,
					entity,
					AuthorizationContextBuilder.read([Permission.START_MEETING])
				);
				expect(authorizationService.hasPermission).toHaveBeenNthCalledWith(
					2,
					user,
					entity,
					AuthorizationContextBuilder.read([Permission.JOIN_MEETING])
				);
			});

			it('should return BBBRole.VIEWER', async () => {
				const { userId, conferenceScope, entityId } = setup();

				const result = await service.determineBbbRole(userId, entityId, conferenceScope);

				expect(result).toBe(BBBRole.VIEWER);
			});
		});

		describe('when user has neither START_MEETING nor JOIN_MEETING permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const entity = courseFactory.buildWithId();
				const conferenceScope = VideoConferenceScope.COURSE;

				authorizationService.hasPermission.mockReturnValueOnce(false).mockReturnValueOnce(false);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findById.mockResolvedValueOnce(entity);

				return {
					user,
					userId: user.id,
					entity,
					entityId: entity.id,
					conferenceScope,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { userId, conferenceScope, entityId } = setup();

				const callDetermineBbbRole = () => service.determineBbbRole(userId, entityId, conferenceScope);

				await expect(callDetermineBbbRole).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
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
				expect(schoolService.hasFeature).toHaveBeenCalledWith(schoolId, SchoolFeature.VIDEOCONFERENCE);
			});
		});

		describe('when video conference feature is enabled for the school', () => {
			it('should not throw an exception', async () => {
				schoolService.hasFeature.mockResolvedValue(true);
				const { schoolId } = setup();

				const func = () => service.throwOnFeaturesDisabled(schoolId);

				await expect(func()).resolves.toBeUndefined();
				expect(schoolService.hasFeature).toHaveBeenCalledWith(schoolId, SchoolFeature.VIDEOCONFERENCE);
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

				const result: ScopeInfo = await service.getScopeInfo(userId, scopeId, conferenceScope);

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

				const result: ScopeInfo = await service.getScopeInfo(userId, scopeId, VideoConferenceScope.EVENT);

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
