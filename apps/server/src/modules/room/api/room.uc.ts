import { Action, AuthorizationService } from '@modules/authorization';
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '@modules/board';
import { RoomMembershipAuthorizable, RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { UserService, UserDo } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission, RoleName, RoomRole } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Room, RoomService } from '../domain';
import { RoomConfig } from '../room.config';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomMemberResponse } from './dto/response/room-member.response';
import { CantChangeOwnersRoleLoggableException } from './loggables/cant-change-roomowners-role.error.loggable';
import { CantPassOwnershipToStudentLoggableException } from './loggables/cant-pass-ownership-to-student.error.loggable';
import { CantPassOwnershipToUserNotInRoomLoggableException } from './loggables/cant-pass-ownership-to-user-not-in-room.error.loggable';

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

		return { room, permissions };
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.checkRoomAuthorization(userId, roomId, Action.write, [Permission.ROOM_DELETE]);
		await this.columnBoardService.deleteByExternalReference({
			type: BoardExternalReferenceType.Room,
			id: roomId,
		});
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
				/* istanbul ignore next */
				throw new Error('User not found in room members');
			}
			return this.mapToMember(member, user);
		});

		return memberResponses;
	}

	private mapToMember(member: UserWithRoomRoles, user: UserDo): RoomMemberResponse {
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

	public async changeRolesOfMembers(
		currentUserId: EntityId,
		roomId: EntityId,
		userIds: Array<EntityId>,
		roleName: RoleName
	): Promise<void> {
		this.checkFeatureEnabled();
		const roomAuthorizable = await this.checkRoomAuthorization(currentUserId, roomId, Action.write, [
			Permission.ROOM_MEMBERS_CHANGE_ROLE,
		]);
		this.preventChangingOwnersRole(roomAuthorizable, userIds, currentUserId);
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, userIds, roleName);
		return Promise.resolve();
	}

	public async passOwnership(currentUserId: EntityId, roomId: EntityId, targetUserId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		const roomAuthorizable = await this.checkRoomAuthorization(currentUserId, roomId, Action.write, [
			Permission.ROOM_CHANGE_OWNER,
		]);
		if (roomAuthorizable.members.find((member) => member.userId === targetUserId) === undefined) {
			throw new CantPassOwnershipToUserNotInRoomLoggableException({ currentUserId, roomId, targetUserId });
		}
		const targetUser = await this.userService.findById(targetUserId);
		if (targetUser.roles.find((role) => role.name === RoleName.STUDENT)) {
			throw new CantPassOwnershipToStudentLoggableException({ currentUserId, roomId, targetUserId });
		}

		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [targetUserId], RoleName.ROOMOWNER);
		await this.roomMembershipService.changeRoleOfRoomMembers(roomId, [currentUserId], RoleName.ROOMADMIN);
		return Promise.resolve();
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
			this.authorizationService.hasPermission(user, item, { action, requiredPermissions: [] })
		);

		return authorizedRoomIds.map((item) => item.roomId);
	}

	private async checkRoomAuthorization(
		userId: EntityId,
		roomId: EntityId,
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<RoomMembershipAuthorizable> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, { action, requiredPermissions });

		return roomMembershipAuthorizable;
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
