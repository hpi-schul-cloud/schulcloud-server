import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CalendarService } from '@infra/calendar';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardNodeAuthorizableService, BoardNodeService, BoardRoles } from '@modules/board';
import { VideoConferenceElement } from '@modules/board/domain';
import {
	boardNodeAuthorizableFactory,
	columnBoardFactory,
	videoConferenceElementFactory,
} from '@modules/board/testing';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { GroupTypes } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { LegacySchoolService } from '@modules/legacy-school';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { RoomService } from '@modules/room';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { roomMembershipFactory } from '@modules/room-membership/testing';
import { roomFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { TeamRepo } from '@modules/team/repo';
import { teamFactory, teamUserFactory } from '@modules/team/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { BBBRole } from '../bbb';
import { VideoConferenceDO, VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { VideoConferenceRepo } from '../repo';
import { videoConferenceDOFactory } from '../testing';
import { VideoConferenceState } from '../uc/dto';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from '../video-conference-config';
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
	let teamRepo: DeepMocked<TeamRepo>;
	let userService: DeepMocked<UserService>;
	let videoConferenceRepo: DeepMocked<VideoConferenceRepo>;
	let config: VideoConferenceConfig;

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
					provide: VIDEO_CONFERENCE_CONFIG_TOKEN,
					useValue: VideoConferenceConfig,
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
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
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
		teamRepo = module.get(TeamRepo);
		userService = module.get(UserService);
		videoConferenceRepo = module.get(VideoConferenceRepo);
		config = module.get(VIDEO_CONFERENCE_CONFIG_TOKEN);

		await setupEntities([User, CourseEntity, CourseGroupEntity]);
	});

	describe('canGuestJoin', () => {
		const setup = (isGuest: boolean, state: VideoConferenceState, waitingRoomEnabled: boolean) => {
			config.scHostUrl = 'https://api.example.com';
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

	describe('isExternalPersonOrTeamExpert', () => {
		describe('when user has EXTERNALPERSON role for a course conference', () => {
			const setup = () => {
				const user = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				config.scHostUrl = 'https://api.example.com';
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

				const result = await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(result).toBe(true);
			});

			it('should call userService.findById', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});
		});

		describe('when user has EXTERNALPERSON role for a room', () => {
			const setup = () => {
				const user = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				config.scHostUrl = 'https://api.example.com';
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

				const result = await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(result).toBe(true);
			});

			it('should call userService.findById', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});
		});

		describe('when user has EXTERNALPERSON role for a video conference element', () => {
			const setup = () => {
				const user = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				config.scHostUrl = 'https://api.example.com';
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

				const result = await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(result).toBe(true);
			});

			it('should call userService.findById', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});
		});

		describe('when user does not have the EXPERT role for a course conference', () => {
			const setup = () => {
				const user = userDoFactory
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

				await service.isExternalPersonOrTeamExpert(userId, VideoConferenceScope.COURSE, scopeId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should return false', async () => {
				const { userId, scopeId } = setup();

				const result = await service.isExternalPersonOrTeamExpert(userId, VideoConferenceScope.COURSE, scopeId);

				expect(result).toBe(false);
			});
		});

		describe('when user has the EXTERNALEXPERT role and an additional role for a course conference', () => {
			const setup = () => {
				const user = userDoFactory
					.withRoles([
						{ id: new ObjectId().toHexString(), name: RoleName.STUDENT },
						{ id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON },
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

				const result = await service.isExternalPersonOrTeamExpert(userId, VideoConferenceScope.COURSE, scopeId);

				expect(result).toBe(false);
				expect(userService.findById).toHaveBeenCalledWith(userId);
			});
		});

		describe('when conference scope is unknown', () => {
			const setup = () => {
				const user = userDoFactory
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

				const func = () =>
					service.isExternalPersonOrTeamExpert(userId, 'invalid-scope' as VideoConferenceScope, scopeId);

				await expect(func()).rejects.toThrow(new BadRequestException('Unknown scope name.'));
			});
		});

		describe('when user has EXTERNALPERSON role for a event conference', () => {
			const setup = () => {
				const user = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.EXTERNALPERSON }])
					.build({ id: new ObjectId().toHexString() });
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();

				const teamUser = teamUserFactory.withRoleAndUserId(roleFactory.buildWithId(), userId).build();
				const team = teamFactory
					.withTeamUser([teamUser])
					.withRoleAndUserId(roleFactory.buildWithId({ name: RoleName.TEAMEXPERT }), userId)
					.build();
				teamRepo.findById.mockResolvedValue(team);

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

				const result = await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(result).toBe(true);
			});

			it('should call teamRepo.findById', async () => {
				const { conferenceScope, userId, scopeId } = setup();

				await service.isExternalPersonOrTeamExpert(userId, conferenceScope, scopeId);

				expect(teamRepo.findById).toHaveBeenCalledWith(scopeId);
			});
		});

		describe('when user does not exist in team', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const userId = user.id as EntityId;
				const scopeId = new ObjectId().toHexString();
				const team = teamFactory.withRoleAndUserId(roleFactory.buildWithId(), userId).build({ teamUsers: [] });
				teamRepo.findById.mockResolvedValue(team);

				return {
					user,
					userId,
					scopeId,
				};
			};

			it('should throw a ForbiddenException', async () => {
				const { scopeId } = setup();

				const func = async () =>
					service.isExternalPersonOrTeamExpert('nonexistentUserId', VideoConferenceScope.EVENT, scopeId);

				await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.UNKNOWN_USER));
			});
		});
	});

	describe('determineBbbRole', () => {
		describe('when user has START_MEETING permission and is in course scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const entity = courseEntityFactory.buildWithId();
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

		describe('when user has room admin role in room scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const { roomAdminRole } = RoomRolesTestFactory.createRoomRoles();
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: roomAdminRole.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				const roomAuthorizable = new RoomAuthorizable(
					'foo',
					[{ userId: user.id, roles: [roomAdminRole], userSchoolId: user.school.id }],
					room.schoolId
				);
				roomMembershipService.getRoomAuthorizable.mockResolvedValueOnce(roomAuthorizable);
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

				expect(roomMembershipService.getRoomAuthorizable).toHaveBeenCalledWith(roomId);
			});

			it('should return BBBRole.MODERATOR', async () => {
				const { userId, conferenceScope, roomId } = setup();

				const result = await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(result).toBe(BBBRole.MODERATOR);
			});
		});

		describe('when user has admin role in video conference node', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.ADMIN] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
					boardContextSettings: {},
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

		describe('when user has editor role in video conference node and room editors may manage video conferences', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
					boardContextSettings: { canRoomEditorManageVideoconference: true },
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
				teamRepo.findById.mockResolvedValueOnce(entity);

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
				const entity = courseEntityFactory.buildWithId();
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

		describe('when user has room editor role in room scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: roomEditorRole.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				const roomAuthorizable = new RoomAuthorizable(
					'foo',
					[{ userId: user.id, roles: [roomEditorRole], userSchoolId: user.school.id }],
					room.schoolId
				);
				roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);
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

				expect(roomMembershipService.getRoomAuthorizable).toHaveBeenCalledWith(roomId);
			});

			it('should return BBBRole.VIEWER', async () => {
				jest.restoreAllMocks();
				const { userId, conferenceScope, roomId } = setup();

				const result = await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(result).toBe(BBBRole.VIEWER);
			});
		});

		describe('when user has room viewer role in room scope', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const { roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				const group = groupFactory.build({
					type: GroupTypes.ROOM,
					users: [{ userId: user.id, roleId: roomViewerRole.id }],
				});
				const room = roomFactory.build();
				roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
				const conferenceScope = VideoConferenceScope.ROOM;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				const roomAuthorizable = new RoomAuthorizable(
					'foo',
					[{ userId: user.id, roles: [roomViewerRole], userSchoolId: user.school.id }],
					room.schoolId
				);
				roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);

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

				expect(roomMembershipService.getRoomAuthorizable).toHaveBeenCalledWith(roomId);
			});

			it('should return BBBRole.VIEWER', async () => {
				jest.restoreAllMocks();
				const { userId, conferenceScope, roomId } = setup();

				const result = await service.determineBbbRole(userId, roomId, conferenceScope);

				expect(result).toBe(BBBRole.VIEWER);
			});
		});

		describe('when user has editor role in video conference node and room editors may NOT manage video conferences', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
					boardContextSettings: { canRoomEditorManageVideoconference: false },
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

		describe('when user has reader role in video conference node', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = videoConferenceElementFactory.build();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.READER] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
					boardContextSettings: {},
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
				const entity = courseEntityFactory.buildWithId();
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
				const roomAuthorizable = new RoomAuthorizable(
					'foo',
					[{ userId: 'anotherUserId', roles: [], userSchoolId: room.schoolId }],
					room.schoolId
				);
				roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);
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
				const roomAuthorizable = new RoomAuthorizable(
					'foo',
					[{ userId: user.id, roles: [], userSchoolId: user.school.id }],
					room.schoolId
				);
				roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);
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

				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: 'anotherUserId', roles: [] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
					boardContextSettings: {},
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

				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [] }],
					id: element.id,
					boardNode: element,
					rootNode: columnBoardFactory.build(),
					boardContextSettings: {},
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

			config.scHostUrl = 'https://api.example.com';

			return {
				userId,

				scopeId,
			};
		};

		describe('when conference scope is VideoConferenceScope.COURSE', () => {
			it('should return scope information for a course', async () => {
				const { userId, scopeId } = setup();
				const conferenceScope = VideoConferenceScope.COURSE;
				const course = courseEntityFactory.buildWithId({ name: 'Course' });
				course.id = scopeId;
				courseService.findById.mockResolvedValue(course);

				const result = await service.getScopeInfo(userId, scopeId, conferenceScope);

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
				const conferenceScope = VideoConferenceScope.ROOM;
				const room = roomFactory.build({ name: 'Room' });
				roomService.getSingleRoom.mockResolvedValueOnce(room);

				const result = await service.getScopeInfo(userId, room.id, conferenceScope);

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
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const element = videoConferenceElementFactory.build({ title: 'Element' });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				const result = await service.getScopeInfo(userId, element.id, conferenceScope);

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
				const event = { title: 'Event', teamId };
				calendarService.findEvent.mockResolvedValue(event);

				const result = await service.getScopeInfo(userId, scopeId, VideoConferenceScope.EVENT);

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
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const element = videoConferenceElementFactory.build({ title: '' });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				const result = await service.getScopeInfo(userId, element.id, conferenceScope);

				expect(result.title).toHaveLength(2);
			});
		});

		describe('when conference scope title has only one character', () => {
			it('should return scope information with a title of two characters', async () => {
				const { userId } = setup();
				const conferenceScope = VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT;
				const element = videoConferenceElementFactory.build({ title: 'E' });
				boardNodeService.findByClassAndId.mockResolvedValueOnce(element);

				const result = await service.getScopeInfo(userId, element.id, conferenceScope);

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
			const user = userDoFactory.buildWithId();
			const userId = user.id as EntityId;
			const roomUser = userFactory.buildWithId();
			const scopeId = new ObjectId().toHexString();
			const team = teamFactory
				.withRoleAndUserId(roleFactory.build({ name: RoleName.EXTERNALPERSON }), new ObjectId().toHexString())
				.build();
			const { roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
			const group = groupFactory.build({
				type: GroupTypes.ROOM,
				users: [{ userId: roomUser.id, roleId: roomEditorRole.id }],
			});
			const room = roomFactory.build();
			roomMembershipFactory.build({ roomId: room.id, userGroupId: group.id });
			const roomAuthorizable = new RoomAuthorizable(
				'foo',
				[{ userId: roomUser.id, roles: [roomEditorRole], userSchoolId: roomUser.school.id }],
				room.schoolId
			);
			roomMembershipService.getRoomAuthorizable.mockResolvedValue(roomAuthorizable);

			const element = videoConferenceElementFactory.build();
			const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
				users: [{ userId: roomUser.id, roles: [BoardRoles.READER] }],
				id: element.id,
				boardNode: element,
				rootNode: columnBoardFactory.build(),
				boardContextSettings: {},
			});
			boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValue(boardNodeAuthorizable);

			const course = courseEntityFactory.buildWithId();
			courseService.findById.mockResolvedValue(course);
			config.scHostUrl = 'https://api.example.com';

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
				courseService.findById.mockResolvedValue(courseEntityFactory.buildWithId({ name: 'Course' }));

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
				courseService.findById.mockResolvedValue(courseEntityFactory.buildWithId({ name: 'Course' }));
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

				expect(result).toEqual({ role: BBBRole.VIEWER, isGuest: false });
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
				teamRepo.findById.mockResolvedValue(team);
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
			const videoConference = videoConferenceDOFactory.build({
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
				const options = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });
				const scope = { id: videoConference.target, scope: videoConference.targetModel };

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
				const options = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });
				const scope = { id: videoConference.target, scope: videoConference.targetModel };

				const newOptions = {
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

				const result = await service.createOrUpdateVideoConferenceForScopeWithOptions(
					scope.id,
					scope.scope,
					newOptions
				);

				expect(result).toEqual({ ...videoConference, options: newOptions });
			});
		});

		describe('when video conference does not exist', () => {
			const setup = () => {
				const options = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });
				const scope = { id: videoConference.target, scope: videoConference.targetModel };

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

				const result = await service.createOrUpdateVideoConferenceForScopeWithOptions(scope.id, scope.scope, options);

				expect(result).toEqual(videoConference);
			});
		});
	});
});
