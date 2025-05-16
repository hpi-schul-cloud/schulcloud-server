import { Logger } from '@core/logger';
import { Action, AuthorizationService } from '@modules/authorization';
import { CopyHelperService } from '@modules/copy-helper';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { ModuleName, SagaService, SagaStep } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Room, RoomService } from '../domain';

@Injectable()
export class CopyRoomStep extends SagaStep<'copyRoom'> {
	private readonly moduleName = ModuleName.ROOM;

	constructor(
		private readonly sagaService: SagaService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly authorizationService: AuthorizationService,
		private readonly copyService: CopyHelperService,

		private readonly logger: Logger
	) {
		super('copyRoom');
		this.logger.setContext(CopyRoomStep.name);
		this.sagaService.registerStep(this.moduleName, this);
	}

	public async execute(params: {
		userId: EntityId;
		roomId: EntityId;
		newName?: string;
	}): Promise<{ id: EntityId; name: string }> {
		const { userId, roomId, newName } = params;

		const roomCopied = await this.copyRoom(userId, roomId, newName);

		return roomCopied;
	}

	private async copyRoom(userId: EntityId, roomId: EntityId, newName?: string): Promise<Room> {
		const originalRoom = await this.roomService.getSingleRoom(roomId);

		const copyName = newName ?? (await this.deriveCopyName(userId, originalRoom.name));
		const roomCopied = await this.roomService.createRoom({
			name: copyName,
			color: originalRoom.color,
			startDate: originalRoom.startDate,
			endDate: originalRoom.endDate,
			schoolId: originalRoom.schoolId, // TODO schoolId // user.schoolId
		});
		await this.roomMembershipService.createNewRoomMembership(roomCopied.id, userId);

		return roomCopied;
	}

	private async deriveCopyName(userId: EntityId, originalRoomName: string): Promise<string> {
		const authorizedRoomIds = await this.getAuthorizedRoomIds(userId, Action.read);
		const existingRooms = await this.roomService.getRoomsByIds(authorizedRoomIds, {});
		const existingNames = existingRooms.data.map((room: Room) => room.name);
		const newName = this.copyService.deriveCopyName(originalRoomName, existingNames);

		return newName;
	}

	private async checkRoomAuthorizationByIds(
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

	private async getAuthorizedRoomIds(userId: EntityId, action: Action): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMembershipService.getRoomMembershipAuthorizablesByUserId(userId);

		const authorizedRoomIds = roomAuthorizables.filter((item) =>
			this.authorizationService.hasPermission(user, item, { action, requiredPermissions: [] })
		);

		return authorizedRoomIds.map((item) => item.roomId);
	}
}
