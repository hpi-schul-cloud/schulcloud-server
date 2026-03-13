import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Action, AuthorizationService } from '../../../authorization';
import { CopyHelperService } from '../../../copy-helper';
import { RoomMembershipService } from '../../../room-membership';
import { ModuleName, SagaService, SagaStep } from '../../../saga';
import { Room, RoomService } from '../../domain';

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
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const originalRoom = await this.roomService.getSingleRoom(roomId);

		const name = newName ?? originalRoom.name;
		const copyName = await this.deriveCopyName(userId, name);

		const roomCopied = await this.roomService.createRoom({
			name: copyName,
			color: originalRoom.color,
			startDate: originalRoom.startDate,
			endDate: originalRoom.endDate,
			schoolId: user.school.id,
			features: [],
		});
		await this.roomMembershipService.createNewRoomMembership(roomCopied.id, userId);

		return roomCopied;
	}

	private async deriveCopyName(userId: EntityId, originalRoomName: string): Promise<string> {
		const authorizedRoomIds = await this.getAuthorizedRoomIds(userId, Action.read);
		const existingRooms = await this.roomService.getRoomsByIds(authorizedRoomIds);
		const existingNames = existingRooms.map((room: Room) => room.name);
		const newName = this.copyService.deriveCopyName(originalRoomName, existingNames);

		return newName;
	}

	private async getAuthorizedRoomIds(userId: EntityId, action: Action): Promise<EntityId[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizables = await this.roomMembershipService.getRoomAuthorizablesByUserId(userId);

		const authorizedRoomIds = roomAuthorizables.filter((item) =>
			this.authorizationService.hasPermission(user, item, { action, requiredPermissions: [] })
		);

		return authorizedRoomIds.map((item) => item.roomId);
	}
}
