import { Action, AuthorizationService } from '@modules/authorization';
// board and rooms has bi-directional dependencies -> cycle
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '@modules/board';
import { RoomMembershipAuthorizable, RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Page, UserDO } from '@shared/domain/domainobject';
import { IFindOptions, Permission, RoleName, RoomRole } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { User } from '@shared/domain/entity';
import { Room, RoomService } from '../domain';
import { RoomConfig } from '../room.config';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomMemberResponse } from './dto/response/room-member.response';
import { CantChangeOwnersRoleLoggableException } from './loggables/cant-change-roomowners-role.error.loggable';
import { CantPassOwnershipToUserNotInRoomLoggableException } from './loggables/cant-pass-ownership-to-user-not-in-room.error.loggable';
import { CantPassOwnershipToStudentLoggableException } from './loggables/cant-pass-ownership-to-student.error.loggable';

type XYZContext = { roomAuthorizable: RoomMembershipAuthorizable; currentUser: User };
type OwnershipContext = XYZContext & { targetUser: UserDO };

@Injectable()
export class RoomUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly userService: UserService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		this.checkFeatureEnabled();
		const authorizedRoomIds = await this.getAuthorizedRoomIds(userId, Action.read);
		const rooms = await this.roomService.getRoomsByIds(authorizedRoomIds, findOptions);

		return rooms;
	}

	public async createRoom(userId: EntityId, props: CreateRoomBodyParams): Promise<Room> {
		this.checkFeatureEnabled();
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const room = await this.roomService.createRoom({ ...props, schoolId: user.school.id });

		this.authorizationService.checkOneOfPermissions(user, [Permission.ROOM_CREATE]);

		try {
			await this.roomMembershipService.createNewRoomMembership(room.id, userId);
			return room;
		} catch (err) {
			await this.roomService.deleteRoom(room);
			throw err;
		}
	}

	public async getSingleRoom(userId: EntityId, roomId: EntityId): Promise<{ room: Room; permissions: Permission[] }> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		const roomMembershipAuthorizable = await this.checkRoomAuthorization(userId, roomId, Action.read);
		const permissions = this.getPermissions(userId, roomMembershipAuthorizable);

		return { room, permissions };
	}

	public async getRoomBoards(userId: EntityId, roomId: EntityId): Promise<ColumnBoard[]> {
		this.checkFeatureEnabled();

		await this.roomService.getSingleRoom(roomId);
		await this.checkRoomAuthorization(userId, roomId, Action.read);

		const boards = await this.columnBoardService.findByExternalReference(
			{
				type: BoardExternalReferenceType.Room,
				id: roomId,
			},
			0
		);

		return boards;
	}

	public async updateRoom(
		userId: EntityId,
		roomId: EntityId,
		props: UpdateRoomBodyParams
	): Promise<{ room: Room; permissions: Permission[] }> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		const roomMembershipAuthorizable = await this.checkRoomAuthorization(userId, roomId, Action.write);
		const permissions = this.getPermissions(userId, roomMembershipAuthorizable);

		await this.roomService.updateRoom(room, props);

		// Sollten wir ein Standard Weg definieren wie permissions für das Frontend angereichtert werden?
		// Über den Auth Service
		// Könntet ihr das Thema mit in Arc Orga bringen?
		return { room, permissions };
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.checkRoomAuthorization(userId, roomId, Action.write, [Permission.ROOM_DELETE]);
		await this.roomService.deleteRoom(room);
		await this.roomMembershipService.deleteRoomMembership(roomId);
	}

	public async getRoomMembers(userId: EntityId, roomId: EntityId): Promise<RoomMemberResponse[]> {
		this.checkFeatureEnabled();
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const currentUser = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(currentUser, roomMembershipAuthorizable, {
			action: Action.read,
			requiredPermissions: [],
		});

		const userIds = roomMembershipAuthorizable.members.map((member) => member.userId);
		const users = await this.userService.findByIds(userIds);

		const memberResponses = users.map((user) => {
			const member = roomMembershipAuthorizable.members.find((item) => item.userId === user.id);
			if (!member) {
				/* istanbul ignore next */ // <------------------------------------------------------- xxxxxxxx
				throw new Error('User not found in room members');
			}
			return this.mapToMember(member, user);
		});

		return memberResponses;
	}

	private mapToMember(member: UserWithRoomRoles, user: UserDO): RoomMemberResponse {
		return new RoomMemberResponse({
			userId: member.userId,
			firstName: user.firstName,
			lastName: user.lastName,
			roomRoleName: member.roles[0].name,
			schoolRoleName: user.roles[0].name,
			schoolName: user.schoolName ?? '',
		});
	}

	public async addMembersToRoom(
		currentUserId: EntityId,
		roomId: EntityId,
		userIds: Array<EntityId>
	): Promise<RoomRole> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(currentUserId, roomId, Action.write, [Permission.ROOM_MEMBERS_ADD]);
		const roleName = await this.roomMembershipService.addMembersToRoom(roomId, userIds);
		return roleName;
	}

	private checkUserInRoom(context: OwnershipContext): void {
		if (context.roomAuthorizable.members.find((member) => member.userId === context.targetUser.id) === undefined) {
			throw new CantPassOwnershipToUserNotInRoomLoggableException(context);
		}
	}

	private checkUserIsStudent(context: OwnershipContext): void {
		if (context.targetUser.roles.find((role) => role.name === RoleName.STUDENT)) {
			throw new CantPassOwnershipToStudentLoggableException(context);
		}
	}

	public async changeRolesOfMembers(
		currentUserId: EntityId,
		roomId: EntityId,
		userIds: Array<EntityId>,
		roleName: RoleName
	): Promise<void> {
		this.checkFeatureEnabled();

		const context = await this.getXYZContext(roomId, currentUserId);

		this.checkRoomAuthorization(context, Action.write, [Permission.ROOM_MEMBERS_CHANGE_ROLE]);
		this.preventChangingOwnersRole(context, userIds, currentUserId);
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, userIds, roleName);
		// Die Methode kann entfernt werden, wie es jetzt auch erfolgt
	}

	// new permission CAN_OWN_ROOMS
	public async passOwnership(currentUserId: EntityId, roomId: EntityId, targetUserId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const ownershipContext = await this.getPassOwnershipContext(roomId, currentUserId, targetUserId);

		this.checkRoomAuthorization(ownershipContext, Action.write, [Permission.ROOM_CHANGE_OWNER]);
		this.checkUserInRoom(ownershipContext);
		this.checkUserIsStudent(ownershipContext);

		await Promise.all([
			this.roomMembershipService.changeRoleOfRoomMembers(roomId, [targetUserId], RoleName.ROOMOWNER),
			this.roomMembershipService.changeRoleOfRoomMembers(roomId, [currentUserId], RoleName.ROOMADMIN),
		]);
		// Die Methode kann entfernt werden, wie es jetzt auch erfolgt
	}

	private preventChangingOwnersRole(context: XYZContext, userIdsToChange: EntityId[], currentUserId: EntityId): void {
		const owner = context.roomAuthorizable.members.find((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);
		if (owner && userIdsToChange.includes(owner.userId)) {
			throw new CantChangeOwnersRoleLoggableException({ roomId: context.roomAuthorizable.roomId, currentUserId });
		}
	}

	public async leaveRoom(currentUserId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(currentUserId, roomId, Action.read, [Permission.ROOM_LEAVE]);
		await this.roomMembershipService.removeMembersFromRoom(roomId, [currentUserId]);
	}

	public async removeMembersFromRoom(currentUserId: EntityId, roomId: EntityId, userIds: EntityId[]): Promise<void> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(currentUserId, roomId, Action.write, [Permission.ROOM_MEMBERS_REMOVE]);
		await this.roomMembershipService.removeMembersFromRoom(roomId, userIds);
	}

	private async getAuthorizedRoomIds(userId: EntityId, action: Action): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMembershipService.getRoomMembershipAuthorizablesByUserId(userId);

		const authorizedRoomIds = roomAuthorizables.filter((item) =>
			// Kann hier auch der authorisation context builder für das object verwendet werden?
			this.authorizationService.hasPermission(user, item, { action, requiredPermissions: [] })
		);

		return authorizedRoomIds.map((item) => item.roomId);
	}

	private async getPassOwnershipContext(
		roomId: EntityId,
		currentUserId: EntityId,
		targetUserId: EntityId
	): Promise<OwnershipContext> {
		const [targetUser, xyzContext] = await Promise.all([
			this.userService.findById(targetUserId),
			this.getXYZContext(roomId, currentUserId),
		]);

		const context = { ...xyzContext, targetUser };

		// Exists a linter rule for "no logic on the return line, but ok for some object with vars which can be seen in debugger"
		return context;
	}

	private async getXYZContext(roomId: EntityId, currentUserId: EntityId): Promise<XYZContext> {
		const [currentUser, roomAuthorizable] = await Promise.all([
			this.authorizationService.getUserWithPermissions(currentUserId),
			this.roomMembershipService.getRoomMembershipAuthorizable(roomId),
		]);

		const context = { roomAuthorizable, currentUser };

		return context;
	}

	private checkRoomAuthorization(context: XYZContext, action: Action, requiredPermissions: Permission[] = []): void {
		this.authorizationService.checkPermission(context.currentUser, context.roomAuthorizable, {
			action,
			requiredPermissions,
		});
	}

	private getPermissions(userId: EntityId, roomMembershipAuthorizable: RoomMembershipAuthorizable): Permission[] {
		const permissions = roomMembershipAuthorizable.members
			.filter((member) => member.userId === userId)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		return permissions;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
