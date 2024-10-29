import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '@src/modules/board';
import { RoomMemberService } from '@src/modules/room-member';
import { Room, RoomCreateProps, RoomService, RoomUpdateProps } from '../domain';
import { RoomConfig } from '../room.config';

@Injectable()
export class RoomUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService,
		private readonly roomMemberService: RoomMemberService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		this.checkFeatureEnabled();
		const authorizedRoomIds = await this.getAuthorizedRoomIds(userId, Action.read);
		const rooms = await this.roomService.getRoomsByIds(authorizedRoomIds, findOptions);

		return rooms;
	}

	public async createRoom(userId: EntityId, props: RoomCreateProps): Promise<Room> {
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const room = await this.roomService.createRoom(props);
		// NOTE: currently only teacher are allowed to create rooms. Could not find simpler way to check this.
		this.authorizationService.checkOneOfPermissions(user, [Permission.COURSE_CREATE]);
		await this.roomMemberService
			.addMemberToRoom(room.id, user.id, RoleName.ROOM_EDITOR, user.school.id)
			.catch(async (err) => {
				await this.roomService.deleteRoom(room);
				throw err;
			});
		return room;
	}

	public async getSingleRoom(userId: EntityId, roomId: EntityId): Promise<Room> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.checkRoomAuthorization(userId, roomId, Action.read);
		return room;
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

	public async updateRoom(userId: EntityId, roomId: EntityId, props: RoomUpdateProps): Promise<Room> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.checkRoomAuthorization(userId, roomId, Action.write);
		await this.roomService.updateRoom(room, props);

		return room;
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		const room = await this.roomService.getSingleRoom(roomId);

		await this.checkRoomAuthorization(userId, roomId, Action.write);
		await this.roomService.deleteRoom(room);
	}

	private async getAuthorizedRoomIds(userId: EntityId, action: Action): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMemberService.getRoomMemberAuthorizablesByUserId(userId);

		const authorizedRoomIds = roomAuthorizables.filter((item) =>
			this.authorizationService.hasPermission(user, item, { action, requiredPermissions: [] })
		);

		return authorizedRoomIds.map((item) => item.roomId);
	}

	private async checkRoomAuthorization(userId: EntityId, roomId: EntityId, action: Action): Promise<void> {
		const roomMemberAuthorizable = await this.roomMemberService.getRoomMemberAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, roomMemberAuthorizable, { action, requiredPermissions: [] });
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
