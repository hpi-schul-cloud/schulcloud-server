import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CalendarEventDto, CalendarService } from '@infra/calendar';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardNodeAuthorizable, BoardNodeAuthorizableService, BoardNodeService, BoardRoles } from '@modules/board';
import { VideoConferenceElement } from '@modules/board/domain';
import { columnBoardFactory, videoConferenceElementFactory } from '@modules/board/testing';
import { GroupTypes } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { CourseService } from '@modules/learnroom/service';
import { LegacySchoolService } from '@modules/legacy-school';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { roomMembershipFactory } from '@modules/room-membership/testing';
import { roomFactory } from '@modules/room/testing';
import { UserService } from '@modules/user';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO, VideoConferenceDO } from '@shared/domain/domainobject';
import { Course, TeamUserEntity } from '@shared/domain/entity';
import { Permission, RoleName, VideoConferenceScope } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { TeamsRepo, VideoConferenceRepo } from '@shared/repo';
import { courseFactory } from '@testing/factory/course.factory';
import { roleFactory } from '@testing/factory/role.factory';
import { teamFactory } from '@testing/factory/team.factory';
import { teamUserFactory } from '@testing/factory/teamuser.factory';
import { userDoFactory } from '@testing/factory/user.do.factory';
import { userFactory } from '@testing/factory/user.factory';
import { videoConferenceDOFactory } from '@testing/factory/video-conference.do.factory';
import { setupEntities } from '@testing/setup-entities';
import { BBBRole } from '../bbb';
import { ErrorStatus } from '../error';
import { VideoConferenceOptions } from '../interface';
import { ScopeInfo, ScopeRef, VideoConferenceState } from '../uc/dto';
import { VideoConferenceConfig } from '../video-conference-config';
import { VideoConferenceService } from './video-conference.service';

describe(VideoConferenceService.name, () => {
	let service: DeepMocked<VideoConferenceService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let courseService: DeepMocked<CourseService>;
	let calendarService: DeepMocked<CalendarService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let roomService: DeepMocked<RoomService>;
	let teamsRepo: DeepMocked<TeamsRepo>;
	let userService: DeepMocked<UserService>;
	let videoConferenceRepo: DeepMocked<VideoConferenceRepo>;
	let configService: DeepMocked<ConfigService<VideoConferenceConfig, true>>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				VideoConferenceService,
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<VideoConferenceConfig, true>>(),
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
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
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
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardNodeService = module.get(BoardNodeService);
		courseService = module.get(CourseService);
		calendarService = module.get(CalendarService);
		authorizationService = module.get(AuthorizationService);
		roomMembershipService = module.get(RoomMembershipService);
		roomService = module.get(RoomService);
		teamsRepo = module.get(TeamsRepo);
		userService = module.get(UserService);
		videoConferenceRepo = module.get(VideoConferenceRepo);
		configService = module.get(ConfigService);

		await setupEntities();
	});

	describe('canGuestJoin', () => {
		const setup = (isGuest: boolean, state: VideoConferenceState, waitingRoomEnabled: boolean) => {
			configService.get.mockReturnValue('https://api.example.com');

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

				configService.get.mockReturnValue('https://api.example.com');
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

		describe('when user has EXPERT role for a room', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXPERT }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				configService.get.mockReturnValueOnce('https://api.example.com');
				userService.findById.mockResolvedValueOnce(user);

				return {
					user,
					userId,
					conferenceScope: VideoConferenceScope.ROOM,
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

		describe('when user has EXPERT role for a video conference element', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXPERT }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				configService.get.mockReturnValueOnce('https://api.example.com');
				userService.findById.mockResolvedValueOnce(user);

				return {
					user,
					userId,
					conferenceScope: VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT,
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

				const func = () => service.hasExpertRole(userId, 'invalid-scope' as VideoConferenceScope, scopeId);

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

		describe('when user has room editor role in room scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roleEditor = roleFactory.buildWithId({
					name: RoleName.ROOMEDITOR,
					permissions: [Permission.ROOM_EDIT],
				});
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: roleEditor.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValueOnce({
					id: 'foo',
					roomId: room.id,
					members: [{ userId: user.id, roles: [roleEditor] }],
					schoolId: room.schoolId,
				});
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				return {
					user,
					userId: user.id,
					room,
					roomId: room.id,
					conferenceScope,
				};
			};

			it('should call the correct service', async () => {
				const { userId, conferenceScope, roomId } = setup();

				await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(roomMembershipService.getRoomMembershipAuthorizable).toHaveBeenCalledWith(roomId);
			});

			it('should return BBBRole.MODERATOR', async () => {
				const { userId, conferenceScope, roomId } = setup();

				const result = await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(result).toBe(BBBRole.MODERATOR);
			});
		});

		describe('when user has editor role in video conference node', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = new BoardNodeAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
				});
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardNodeAuthorizable);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				return {
					user,
					userId: user.id,
					element,
					elementId: element.id,
					conferenceScope,
				};
			};

			it('should call the correct service', async () => {
				const { userId, conferenceScope, element, elementId } = setup();

				await service.determineBbbRole(userId, elementId, conferenceScope);

				expect(boardNodeAuthorizableService.getBoardAuthorizable).toHaveBeenCalledWith(element);
			});

			it('should return BBBRole.MODERATOR', async () => {
				const { userId, conferenceScope, elementId } = setup();

				const result = await service.determineBbbRole(userId, elementId, conferenceScope);

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

		describe('when user has JOIN_MEETING permission and is in course scope', () => {
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

		describe('when user has room viewer role in room scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roleViewer = roleFactory.buildWithId({ name: RoleName.ROOMVIEWER, permissions: [Permission.ROOM_VIEW] });
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: roleViewer.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomMembershipService.getRoomMembershipAuthorizable
					.mockResolvedValueOnce({
						id: 'foo',
						roomId: room.id,
						members: [{ userId: user.id, roles: [roleViewer] }],
						schoolId: room.schoolId,
					})
					.mockResolvedValueOnce({
						id: 'foo',
						roomId: room.id,
						members: [{ userId: user.id, roles: [roleViewer] }],
						schoolId: room.schoolId,
					});
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				return {
					user,
					userId: user.id,
					room,
					roomId: room.id,
					conferenceScope,
				};
			};

			it('should call the correct service', async () => {
				const { userId, conferenceScope, roomId } = setup();

				await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(roomMembershipService.getRoomMembershipAuthorizable).toHaveBeenCalledWith(roomId);
			});

			it('should return BBBRole.VIEWER', async () => {
				jest.restoreAllMocks();
				const { userId, conferenceScope, roomId } = setup();

				const result = await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(result).toBe(BBBRole.VIEWER);
			});
		});

		describe('when user has reader role in video conference node', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = new BoardNodeAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.READER] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
				});
				boardNodeAuthorizableService.getBoardAuthorizable
					.mockResolvedValueOnce(boardNodeAuthorizable)
					.mockResolvedValueOnce(boardNodeAuthorizable);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				return {
					user,
					userId: user.id,
					element,
					elementId: element.id,
					conferenceScope,
				};
			};

			it('should call the correct service', async () => {
				const { userId, conferenceScope, element, elementId } = setup();

				await service.determineBbbRole(userId, elementId, conferenceScope);

				expect(boardNodeAuthorizableService.getBoardAuthorizable).toHaveBeenCalledWith(element);
			});

			it('should return BBBRole.VIEWER', async () => {
				const { userId, conferenceScope, elementId } = setup();

				const result = await service.determineBbbRole(userId, elementId, conferenceScope);

				expect(result).toBe(BBBRole.VIEWER);
			});
		});

		describe('when user has neither START_MEETING nor JOIN_MEETING permission in course scope', () => {
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

		describe('when user has neither editor nor viewer role in room scope and is not authorized for the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const role = roleFactory.buildWithId();
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: role.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomMembershipService.getRoomMembershipAuthorizable
					.mockResolvedValueOnce({
						id: 'foo',
						roomId: room.id,
						members: [{ userId: 'anotherUserId', roles: [] }],
						schoolId: room.schoolId,
					})
					.mockResolvedValueOnce({
						id: 'foo',
						roomId: room.id,
						members: [{ userId: 'anotherUserId', roles: [] }],
						schoolId: room.schoolId,
					});
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				return {
					user,
					userId: user.id,
					room,
					roomId: room.id,
					conferenceScope,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { userId, conferenceScope, roomId } = setup();

				const callDetermineBbbRole = () => service.determineBbbRole(userId, roomId, conferenceScope);

				await expect(callDetermineBbbRole).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});
		});

		describe('when user has neither editor nor viewer role in room scope but is authorized for the room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const role = roleFactory.buildWithId();
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: role.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				roomMembershipService.getRoomMembershipAuthorizable
					.mockResolvedValueOnce({
						id: 'foo',
						roomId: room.id,
						members: [{ userId: user.id, roles: [] }],
						schoolId: room.schoolId,
					})
					.mockResolvedValueOnce({
						id: 'foo',
						roomId: room.id,
						members: [{ userId: user.id, roles: [] }],
						schoolId: room.schoolId,
					});
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				return {
					user,
					userId: user.id,
					room,
					roomId: room.id,
					conferenceScope,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { userId, conferenceScope, roomId } = setup();

				const callDetermineBbbRole = () => service.determineBbbRole(userId, roomId, conferenceScope);

				await expect(callDetermineBbbRole).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});
		});

		describe('when user has neither editor nor reader role in video conference node and is not authorized for the node', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = new BoardNodeAuthorizable({
					users: [{ userId: 'anotherUserId', roles: [] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
				});
				boardNodeAuthorizableService.getBoardAuthorizable
					.mockResolvedValueOnce(boardNodeAuthorizable)
					.mockResolvedValueOnce(boardNodeAuthorizable);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				return {
					user,
					userId: user.id,
					element,
					elementId: element.id,
					conferenceScope,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { userId, conferenceScope, elementId } = setup();

				const callDetermineBbbRole = () => service.determineBbbRole(userId, elementId, conferenceScope);

				await expect(callDetermineBbbRole).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
			});
		});

		describe('when user has neither editor nor reader role in video conference node but is authorized for the node', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = new BoardNodeAuthorizable({
					users: [{ userId: user.id, roles: [] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
				});
				boardNodeAuthorizableService.getBoardAuthorizable
					.mockResolvedValueOnce(boardNodeAuthorizable)
					.mockResolvedValueOnce(boardNodeAuthorizable);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				return {
					user,
					userId: user.id,
					element,
					elementId: element.id,
					conferenceScope,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { userId, conferenceScope, elementId } = setup();

				const callDetermineBbbRole = () => service.determineBbbRole(userId, elementId, conferenceScope);

				await expect(callDetermineBbbRole).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
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

			const scopeId = new ObjectId().toHexString();

			configService.get.mockReturnValue('https://api.example.com');

			return {
				userId,

				scopeId,
			};
		};

		describe('when conference scope is VideoConferenceScope.COURSE', () => {
			it('should return scope information for a course', async () => {
				const { userId, scopeId } = setup();
				const conferenceScope: VideoConferenceScope = VideoConferenceScope.COURSE;
				const course: Course = courseFactory.buildWithId({ name: 'Course' });
				course.id = scopeId;
				courseService.findById.mockResolvedValue(course);

				const result: ScopeInfo = await service.getScopeInfo(userId, scopeId, conferenceScope);

				expect(result).toEqual({
					scopeId,
					scopeName: VideoConferenceScope.COURSE,
					logoutUrl: `${service.hostUrl}/courses/${scopeId}?activeTab=tools`,
					title: course.name,
				});
				expect(courseService.findById).toHaveBeenCalledWith(scopeId);
			});
		});

		describe('when conference scope is VideoConferenceScope.ROOM', () => {
			it('should return scope information for a room', async () => {
				const { userId } = setup();
				const conferenceScope: VideoConferenceScope = VideoConferenceScope.ROOM;
				const room = roomFactory.build({ name: 'Room' });
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				const result: ScopeInfo = await service.getScopeInfo(userId, room.id, conferenceScope);

				expect(result).toEqual({
					scopeId: room.id,
					scopeName: VideoConferenceScope.ROOM,
					logoutUrl: `${service.hostUrl}/rooms/${room.id}`,
					title: room.name,
				});
				expect(roomService.getSingleRoom).toHaveBeenCalledWith(room.id);
			});
		});

		describe('when conference scope is VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT', () => {
			it('should return scope information for a video conference element', async () => {
				const { userId } = setup();
				const conferenceScope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const element = videoConferenceElementFactory.build({ title: 'Element' });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				const result: ScopeInfo = await service.getScopeInfo(userId, element.id, conferenceScope);

				expect(result).toEqual({
					scopeId: element.id,
					scopeName: VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT,
					logoutUrl: `${service.hostUrl}/boards/${element.id}`,
					title: element.title,
				});
				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(VideoConferenceElement, element.id);
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
					scopeName: VideoConferenceScope.EVENT,
					logoutUrl: `${service.hostUrl}/teams/${teamId}?activeTab=events`,
					title: event.title,
				});
				expect(calendarService.findEvent).toHaveBeenCalledWith(userId, scopeId);
			});
		});

		describe('when conference scope title is empty', () => {
			it('should return scope information with a title of two characters', async () => {
				const { userId } = setup();
				const conferenceScope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const element = videoConferenceElementFactory.build({ title: '' });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				const result: ScopeInfo = await service.getScopeInfo(userId, element.id, conferenceScope);

				expect(result.title).toHaveLength(2);
			});
		});

		describe('when conference scope title has only one character', () => {
			it('should return scope information with a title of two characters', async () => {
				const { userId } = setup();
				const conferenceScope: VideoConferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const element = videoConferenceElementFactory.build({ title: 'E' });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				const result: ScopeInfo = await service.getScopeInfo(userId, element.id, conferenceScope);

				expect(result.title).toHaveLength(2);
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

	describe('getUserRoleAndGuestStatusByUserIdForBbb', () => {
		const setup = (conferenceScope: VideoConferenceScope) => {
			const user: UserDO = userDoFactory.buildWithId();
			const userId = user.id as EntityId;
			const roomUser = userFactory.buildWithId();
			const scopeId = new ObjectId().toHexString();
			const team = teamFactory
				.withRoleAndUserId(roleFactory.build({ name: RoleName.EXPERT }), new ObjectId().toHexString())
				.build();
			const roleEditor = roleFactory.buildWithId({ name: RoleName.ROOMEDITOR, permissions: [Permission.ROOM_EDIT] });
			const group = groupFactory.build({
				type: GroupTypes.ROOM,
				users: [{ userId: roomUser.id, roleId: roleEditor.id }],
			});
			const room = roomFactory.build();
			roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
			roomMembershipService.getRoomMembershipAuthorizable
				.mockResolvedValueOnce({
					id: 'foo',
					roomId: room.id,
					members: [{ userId: roomUser.id, roles: [roleEditor] }],
					schoolId: room.schoolId,
				})
				.mockResolvedValueOnce({
					id: 'foo',
					roomId: room.id,
					members: [{ userId: roomUser.id, roles: [roleEditor] }],
					schoolId: room.schoolId,
				});

			const element = videoConferenceElementFactory.build();
			const boardNodeAuthorizable = new BoardNodeAuthorizable({
				users: [{ userId: roomUser.id, roles: [BoardRoles.READER] }],
				id: element.id,
				boardNode: element,
				rootNode: columnBoardFactory.build(),
			});
			boardNodeAuthorizableService.getBoardAuthorizable
				.mockResolvedValueOnce(boardNodeAuthorizable)
				.mockResolvedValueOnce(boardNodeAuthorizable);

			const course = courseFactory.buildWithId();
			courseService.findById.mockResolvedValue(course);

			configService.get.mockReturnValue('https://api.example.com');

			return {
				user,
				userId,
				conferenceScope,
				room,
				roomUser,
				scopeId,
				team,
				element,
			};
		};

		describe('when conference scope is VideoConferenceScope.COURSE', () => {
			it('should call courseRepo.findById', async () => {
				const { user, userId, conferenceScope, scopeId } = setup(VideoConferenceScope.COURSE);
				userService.findById.mockResolvedValue(user);
				courseService.findById.mockResolvedValue(courseFactory.buildWithId({ name: 'Course' }));

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

		describe('when conference scope is VideoConferenceScope.ROOM', () => {
			const setupForRoom = () => {
				const { user, userId, conferenceScope, room, roomUser, scopeId } = setup(VideoConferenceScope.ROOM);
				userService.findById.mockResolvedValue(user);
				roomService.getSingleRoom.mockResolvedValue(room);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(roomUser);

				return { userId, scopeId, conferenceScope };
			};

			it('should call roomService.getSingleRoom', async () => {
				const { userId, conferenceScope, scopeId } = setupForRoom();

				await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(roomService.getSingleRoom).toHaveBeenCalledWith(scopeId);
			});

			it('should call userService.findById', async () => {
				const { userId, conferenceScope, scopeId } = setupForRoom();

				await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should return the user role and guest status for a room conference', async () => {
				const { userId, conferenceScope, scopeId } = setupForRoom();

				const result = await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(result).toEqual({ role: BBBRole.MODERATOR, isGuest: false });
			});
		});

		describe('when conference scope is VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT', () => {
			const setupForElement = () => {
				const { user, userId, conferenceScope, element, roomUser, scopeId } = setup(
					VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT
				);
				userService.findById.mockResolvedValue(user);
				boardNodeService.findByClassAndId.mockResolvedValue(element);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(roomUser);

				return { userId, scopeId, conferenceScope };
			};

			it('should call boardNodeService.findByClassAndId', async () => {
				const { userId, conferenceScope, scopeId } = setupForElement();

				await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(VideoConferenceElement, scopeId);
			});

			it('should call userService.findById', async () => {
				const { userId, conferenceScope, scopeId } = setupForElement();

				await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should return the user role and guest status for a video conference element conference', async () => {
				const { userId, conferenceScope, scopeId } = setupForElement();

				const result = await service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

				expect(result).toEqual({ role: BBBRole.VIEWER, isGuest: false });
			});
		});

		describe('when conference scope is VideoConferenceScope.EVENT', () => {
			const setupForEvent = () => {
				const { userId, scopeId, team, conferenceScope } = setup(VideoConferenceScope.EVENT);
				teamsRepo.findById.mockResolvedValue(team);
				calendarService.findEvent.mockResolvedValue({ title: 'Event', teamId: team.id });

				return { userId, conferenceScope, scopeId };
			};

			it('should throw a ForbiddenException if the user is not an expert for an event conference', async () => {
				const { userId, conferenceScope, scopeId } = setupForEvent();

				const func = () => service.getUserRoleAndGuestStatusByUserIdForBbb(userId, scopeId, conferenceScope);

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
