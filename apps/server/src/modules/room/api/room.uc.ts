import { Action, AuthorizationService } from '@modules/authorization';
import { RoomMemberAuthorizable, RoomMemberService, UserWithRoomRoles } from '@modules/room-member';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Page, UserDO } from '@shared/domain/domainobject';
import { IFindOptions, Permission, RoleName, RoomRole } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '@src/modules/board';
import { Room, RoomService } from '../domain';
import { RoomConfig } from '../room.config';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomMemberResponse } from './dto/response/room-member.response';

@Injectable()
export class RoomUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService,
		private readonly roomMemberService: RoomMemberService,
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

		await this.roomMemberService
			.addMembersToRoom(room.id, [{ userId: user.id, roleName: RoleName.ROOM_EDITOR }], user.school.id)
			.catch(async (err) => {
				await this.roomService.deleteRoom(room);
				throw err;
			});

		return room;
	}

	public async getSingleRoom(userId: EntityId, roomId: EntityId): Promise<{ room: Room; permissions: Permission[] }> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		const roomMemberAuthorizable = await this.checkRoomAuthorization(userId, roomId, Action.read);
		const permissions = this.getPermissions(userId, roomMemberAuthorizable);

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

		const roomMemberAuthorizable = await this.checkRoomAuthorization(userId, roomId, Action.write);
		const permissions = this.getPermissions(userId, roomMemberAuthorizable);

		await this.roomService.updateRoom(room, props);

		return { room, permissions };
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.checkRoomAuthorization(userId, roomId, Action.write, [Permission.ROOM_DELETE]);
		await this.roomService.deleteRoom(room);
	}

	public async getRoomMembers(userId: EntityId, roomId: EntityId): Promise<RoomMemberResponse[]> {
		this.checkFeatureEnabled();
		const roomMemberAuthorizable = await this.roomMemberService.getRoomMemberAuthorizable(roomId);
		const currentUser = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(currentUser, roomMemberAuthorizable, {
			action: Action.read,
			requiredPermissions: [],
		});

		const userIds = roomMemberAuthorizable.members.map((member) => member.userId);
		const users = await this.userService.findByIds(userIds);

		const memberResponses = users.map((user) => {
			const member = roomMemberAuthorizable.members.find((item) => item.userId === user.id);
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
		userIdsAndRoles: Array<{ userId: EntityId; roleName: RoomRole }>
	): Promise<void> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(currentUserId, roomId, Action.write);
		await this.roomMemberService.addMembersToRoom(roomId, userIdsAndRoles);
	}

	private mapToMember(member: UserWithRoomRoles, user: UserDO) {
		return new RoomMemberResponse({
			userId: member.userId,
			firstName: user.firstName,
			lastName: user.lastName,
			roleName: member.roles[0].name,
			schoolName: user.schoolName ?? '',
		});
	}

	public async removeMembersFromRoom(currentUserId: EntityId, roomId: EntityId, userIds: EntityId[]): Promise<void> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(currentUserId, roomId, Action.write);
		await this.roomMemberService.removeMembersFromRoom(roomId, userIds);
	}

	private async getAuthorizedRoomIds(userId: EntityId, action: Action): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMemberService.getRoomMemberAuthorizablesByUserId(userId);

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
	): Promise<RoomMemberAuthorizable> {
		const roomMemberAuthorizable = await this.roomMemberService.getRoomMemberAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, roomMemberAuthorizable, { action, requiredPermissions });

		return roomMemberAuthorizable;
	}

	private getPermissions(userId: EntityId, roomMemberAuthorizable: RoomMemberAuthorizable): Permission[] {
		const permissions = roomMemberAuthorizable.members
			.filter((member) => member.userId === userId)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		return permissions;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
