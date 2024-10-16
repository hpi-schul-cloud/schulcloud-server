import { BadRequest } from '@feathersjs/errors';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { RoomMemberRepo, RoomMemberService } from '@src/modules/room-member';
import { Room, RoomCreateProps, RoomService, RoomUpdateProps } from '../domain';
import { RoomAuthorizable } from '../domain/do/room-authorizable';
import { RoomConfig } from '../room.config';

@Injectable()
export class RoomUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomService: RoomService,
		private readonly roomMemberService: RoomMemberService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembersRepo: RoomMemberRepo
	) {}

	public async getRooms(userId: EntityId, findOptions: IFindOptions<Room>): Promise<Page<Room>> {
		this.checkFeatureEnabled();
		const authorizedRoomIds = await this.getAuthorizedRoomIds(userId);
		const rooms = await this.roomService.getRoomsByIds(authorizedRoomIds, findOptions);

		return rooms;
	}

	public async createRoom(userId: EntityId, props: RoomCreateProps): Promise<Room> {
		this.checkFeatureEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		// NOTE: currently only teacher are allowed to create rooms. Could not find simpler way to check this.
		this.authorizationService.checkOneOfPermissions(user, [Permission.COURSE_CREATE]);
		const room = await this.roomService.createRoom(props);
		await this.roomMemberService.addMemberToRoom(room.id, user, RoleName.ROOM_EDITOR).catch(async (err) => {
			await this.roomService.deleteRoom(room);
			throw err;
		});
		return room;
	}

	public async getSingleRoom(userId: EntityId, roomId: EntityId): Promise<Room> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(userId, roomId, Action.read);

		const room = await this.roomService.getSingleRoom(roomId);
		return room;
	}

	public async updateRoom(userId: EntityId, roomId: EntityId, props: RoomUpdateProps): Promise<Room> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(userId, roomId, Action.write);

		const room = await this.roomService.getSingleRoom(roomId);
		await this.roomService.updateRoom(room, props);

		return room;
	}

	public async deleteRoom(userId: EntityId, roomId: EntityId): Promise<void> {
		this.checkFeatureEnabled();
		await this.checkRoomAuthorization(userId, roomId, Action.write);

		const room = await this.roomService.getSingleRoom(roomId);

		await this.roomService.deleteRoom(room);
	}

	private async getAuthorizedRoomIds(userId: EntityId): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const allRoomMembers = await this.roomMembersRepo.findByUserId(userId);
		const permittedRoomIds = allRoomMembers
			.filter((member) => {
				const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [member] });
				const hasPermission = this.authorizationService.hasPermission(user, roomAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				return hasPermission;
			})
			.map((member) => member.roomId.toHexString());

		return permittedRoomIds;
	}

	private async checkRoomAuthorization(userId: EntityId, roomId: EntityId, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (!roomMember) throw new BadRequest('Room members not found');
		const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [roomMember] });
		this.authorizationService.checkPermission(user, roomAuthorizable, {
			action,
			requiredPermissions: [],
		});
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}
}
