import { Action, AuthorizationService } from '@modules/authorization';
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '@modules/board';
import { RoleName, RoomRole } from '@modules/role';
import { RoomMembershipAuthorizable, RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { UserDo, UserService } from '@modules/user';
import { User } from '@modules/user/repo'; // TODO: Auth service should use a different type
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Room, RoomService } from '../domain';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomMemberResponse } from './dto/response/room-member.response';
import { CantChangeOwnersRoleLoggableException } from './loggables/cant-change-roomowners-role.error.loggable';
import { CantPassOwnershipToStudentLoggableException } from './loggables/cant-pass-ownership-to-student.error.loggable';
import { CantPassOwnershipToUserNotInRoomLoggableException } from './loggables/cant-pass-ownership-to-user-not-in-room.error.loggable';
import { UserToAddToRoomNotFoundLoggableException } from './loggables/user-not-found.error.loggable';
import { RoomPermissionService } from './service';

type BaseContext = { roomAuthorizable: RoomMembershipAuthorizable; currentUser: User };
type OwnershipContext = BaseContext & { targetUser: UserDo };

@Injectable()
export class RoomUc {
	constructor(
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly userService: UserService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomHelperService: RoomPermissionService
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		const authorizedRoomIds = await this.getAuthorizedRoomIds(userId, Action.read);
		const rooms = await this.roomService.getRoomsByIds(authorizedRoomIds, findOptions);

		return rooms;
	}

	public async createRoom(userId: EntityId, props: CreateRoomBodyParams): Promise<Room> {
		this.roomHelperService.checkFeatureRoomsEnabled();
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
		this.roomHelperService.checkFeatureRoomsEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		const roomMembershipAuthorizable = await this.roomHelperService.checkRoomAuthorizationByIds(
			userId,
			roomId,
			Action.read
		);
		const permissions = this.getPermissions(userId, roomMembershipAuthorizable);

		return { room, permissions };
	}

	public async getRoomBoards(userId: EntityId, roomId: EntityId): Promise<ColumnBoard[]> {
		this.roomHelperService.checkFeatureRoomsEnabled();

		await this.roomService.getSingleRoom(roomId);
		await this.roomHelperService.checkRoomAuthorizationByIds(userId, roomId, Action.read);

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
		this.roomHelperService.checkFeatureRoomsEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		const roomMembershipAuthorizable = await this.roomHelperService.checkRoomAuthorizationByIds(
			userId,
			roomId,
			Action.write
		);

		const permissions = this.getPermissions(userId, roomMembershipAuthorizable);

		await this.roomService.updateRoom(room, props);

		return { room, permissions };
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.roomHelperService.checkRoomAuthorizationByIds(userId, roomId, Action.write, [Permission.ROOM_DELETE]);
		await this.columnBoardService.deleteByExternalReference({
			type: BoardExternalReferenceType.Room,
			id: roomId,
		});
		await this.roomService.deleteRoom(room);
		await this.roomMembershipService.deleteRoomMembership(roomId);
	}

	public async getRoomMembers(userId: EntityId, roomId: EntityId): Promise<RoomMemberResponse[]> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const currentUser = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(currentUser, roomMembershipAuthorizable, {
			action: Action.read,
			requiredPermissions: [],
		});

		const userIds = roomMembershipAuthorizable.members.map((member) => member.userId);
		const users = (await this.userService.findByIds(userIds)).filter((user) => !user.deletedAt);

		const memberResponses = users.map((user) => {
			const member = roomMembershipAuthorizable.members.find((item) => item.userId === user.id);
			if (!member) {
				/* istanbul ignore next */
				throw new Error('User not found in room members');
			}
			return this.mapToMember(member, user);
		});

		return memberResponses;
	}

	public async addMembersToRoom(
		currentUserId: EntityId,
		roomId: EntityId,
		userIds: Array<EntityId>
	): Promise<RoomRole> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		await this.roomHelperService.checkRoomAuthorizationByIds(currentUserId, roomId, Action.write, [
			Permission.ROOM_MEMBERS_ADD,
		]);
		await this.checkUsersAccessible(currentUserId, userIds);
		const roleName = await this.roomMembershipService.addMembersToRoom(roomId, userIds);
		return roleName;
	}

	public async changeRolesOfMembers(
		currentUserId: EntityId,
		roomId: EntityId,
		userIds: Array<EntityId>,
		roleName: RoleName
	): Promise<void> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		const roomAuthorizable = await this.roomHelperService.checkRoomAuthorizationByIds(
			currentUserId,
			roomId,
			Action.write,
			[Permission.ROOM_MEMBERS_CHANGE_ROLE]
		);
		this.preventChangingOwnersRole(roomAuthorizable, userIds, currentUserId);
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, userIds, roleName);
	}

	public async passOwnership(currentUserId: EntityId, roomId: EntityId, targetUserId: EntityId): Promise<void> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		const ownershipContext = await this.getPassOwnershipContext(roomId, currentUserId, targetUserId);

		this.checkRoomAuthorizationByContext(ownershipContext, Action.write, [Permission.ROOM_CHANGE_OWNER]);
		this.checkUserInRoom(ownershipContext);
		this.checkUserIsStudent(ownershipContext);

		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [currentUserId], RoleName.ROOMADMIN);
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [targetUserId], RoleName.ROOMOWNER);
	}

	public async leaveRoom(currentUserId: EntityId, roomId: EntityId): Promise<void> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		await this.roomHelperService.checkRoomAuthorizationByIds(currentUserId, roomId, Action.read, [
			Permission.ROOM_LEAVE,
		]);
		await this.roomMembershipService.removeMembersFromRoom(roomId, [currentUserId]);
	}

	public async removeMembersFromRoom(currentUserId: EntityId, roomId: EntityId, userIds: EntityId[]): Promise<void> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		await this.roomHelperService.checkRoomAuthorizationByIds(currentUserId, roomId, Action.write, [
			Permission.ROOM_MEMBERS_REMOVE,
		]);
		await this.roomMembershipService.removeMembersFromRoom(roomId, userIds);
	}

	private async getPassOwnershipContext(
		roomId: EntityId,
		currentUserId: EntityId,
		targetUserId: EntityId
	): Promise<OwnershipContext> {
		const [roomContext, targetUser] = await Promise.all([
			this.getRoomContext(roomId, currentUserId),
			this.userService.findById(targetUserId),
		]);
		const context = { ...roomContext, targetUser };

		return context;
	}

	private async getRoomContext(roomId: EntityId, currentUserId: EntityId): Promise<BaseContext> {
		const [roomAuthorizable, currentUser] = await Promise.all([
			this.roomMembershipService.getRoomMembershipAuthorizable(roomId),
			this.authorizationService.getUserWithPermissions(currentUserId),
		]);

		const context = { roomAuthorizable, currentUser };

		return context;
	}

	private checkUserInRoom(context: OwnershipContext): void {
		const { targetUser, roomAuthorizable } = context;
		const isRoomMember = roomAuthorizable.members.find((member) => member.userId === targetUser.id);
		if (isRoomMember === undefined) {
			throw new CantPassOwnershipToUserNotInRoomLoggableException({
				roomId: context.roomAuthorizable.roomId,
				currentUserId: context.currentUser.id,
				targetUserId: context.targetUser.id || 'undefined',
			});
		}
	}

	private checkUserIsStudent(context: OwnershipContext): void {
		if (context.targetUser.roles.find((role) => role.name === RoleName.STUDENT)) {
			throw new CantPassOwnershipToStudentLoggableException({
				roomId: context.roomAuthorizable.roomId,
				currentUserId: context.currentUser.id,
				targetUserId: context.targetUser.id || 'undefined',
			});
		}
	}

	private checkRoomAuthorizationByContext(
		context: BaseContext,
		action: Action,
		requiredPermissions: Permission[] = []
	): void {
		this.authorizationService.checkPermission(context.currentUser, context.roomAuthorizable, {
			action,
			requiredPermissions,
		});
	}

	private mapToMember(member: UserWithRoomRoles, user: UserDo): RoomMemberResponse {
		const schoolRoleNames = user.roles.map((role) => role.name);
		return new RoomMemberResponse({
			userId: member.userId,
			firstName: user.firstName,
			lastName: user.lastName,
			roomRoleName: member.roles[0].name,
			schoolRoleNames,
			schoolName: user.schoolName ?? '',
		});
	}

	private preventChangingOwnersRole(
		roomAuthorizable: RoomMembershipAuthorizable,
		userIdsToChange: EntityId[],
		currentUserId: EntityId
	): void {
		const owner = roomAuthorizable.members.find((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);
		if (owner && userIdsToChange.includes(owner.userId)) {
			throw new CantChangeOwnersRoleLoggableException({ roomId: roomAuthorizable.roomId, currentUserId });
		}
	}

	private async getAuthorizedRoomIds(userId: EntityId, action: Action): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMembershipService.getRoomMembershipAuthorizablesByUserId(userId);

		const authorizedRoomIds = roomAuthorizables.filter((item) =>
			this.authorizationService.hasPermission(user, item, { action, requiredPermissions: [] })
		);

		return authorizedRoomIds.map((item) => item.roomId);
	}

	private getPermissions(userId: EntityId, roomMembershipAuthorizable: RoomMembershipAuthorizable): Permission[] {
		const permissions = roomMembershipAuthorizable.members
			.filter((member) => member.userId === userId)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		return permissions;
	}

	private async checkUsersAccessible(currentUserId: EntityId, userIds: Array<EntityId>): Promise<void> {
		const currentUser = await this.authorizationService.getUserWithPermissions(currentUserId);
		const foundUsers = await this.userService.findByIds(userIds);

		const isUserAccessibleFilter = this.createUserAccessibleFilter(currentUser);

		const foundAndAccessibleIds = foundUsers.filter(isUserAccessibleFilter).map(this.userToId);
		const notAccessibleUserIds = this.removeMatchingIds(userIds, foundAndAccessibleIds);

		if (notAccessibleUserIds.length > 0) {
			throw new UserToAddToRoomNotFoundLoggableException(notAccessibleUserIds);
		}
	}

	private removeMatchingIds(original: EntityId[], toRemove: EntityId[]): EntityId[] {
		return original.filter((item) => !toRemove.includes(item));
	}

	private createUserAccessibleFilter =
		(currentUser: User) =>
		(user: UserDo): boolean =>
			this.authorizationService.hasPermission(currentUser, user, {
				action: Action.read,
				requiredPermissions: [],
			});
	private userToId = (user: UserDo): string => user.id || '';
}
