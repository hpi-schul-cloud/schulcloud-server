import { ConfigService } from '@nestjs/config';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { IFindOptions, Permission, RoleName } from '@shared/domain/interface';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { RoomMemberService } from '@src/modules/room-member';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { Room, RoomCreateProps, RoomService, RoomUpdateProps } from '../domain';
import { RoomConfig } from '../room.config';

@Injectable()
export class RoomUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService,
		private readonly roomMemberService: RoomMemberService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		this.checkFeatureEnabled();
		const rooms = await this.roomService.getRooms(findOptions);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const authorizationList = await this.roomMemberService.batchHasAuthorization(
			rooms.data.map((room) => room.id),
			user,
			Action.read
		);
		const permittedRoomSet = new Set<EntityId>();
		authorizationList.forEach(({ hasAuthorization, roomId }) => {
			if (hasAuthorization) permittedRoomSet.add(roomId);
		});
		const authorizedRooms = rooms.data.filter((room) => permittedRoomSet.has(room.id));

		// TODO: must find a way to pagainate correctly over the authorized roomIds
		return new Page(authorizedRooms, authorizedRooms.length);
	}

	public async createRoom(userId: EntityId, props: RoomCreateProps): Promise<Room> {
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		// NOTE: currently only teacher are allowed to create rooms. Could not find simpler way to check this.
		this.authorizationService.checkOneOfPermissions(user, [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3]);
		const room = await this.roomService.createRoom(props);
		await this.roomMemberService.addMemberToRoom(room.id, user, RoleName.ROOM_EDITOR);
		return room;
	}

	public async getSingleRoom(userId: EntityId, roomId: EntityId): Promise<Room> {
		this.checkFeatureEnabled();
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const hasAuthorization = await this.roomMemberService.hasAuthorization(roomId, user, Action.read);
		if (!hasAuthorization) throw new ForbiddenException();

		const room = await this.roomService.getSingleRoom(roomId);
		return room;
	}

	public async updateRoom(userId: EntityId, roomId: EntityId, props: RoomUpdateProps): Promise<Room> {
		this.checkFeatureEnabled();
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const hasAuthorization = await this.roomMemberService.hasAuthorization(roomId, user, Action.write);
		if (!hasAuthorization) throw new ForbiddenException();

		const room = await this.roomService.getSingleRoom(roomId);
		await this.roomService.updateRoom(room, props);

		return room;
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const hasAuthorization = await this.roomMemberService.hasAuthorization(roomId, user, Action.write);
		if (!hasAuthorization) throw new ForbiddenException();

		const room = await this.roomService.getSingleRoom(roomId);

		await this.roomService.deleteRoom(room);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
