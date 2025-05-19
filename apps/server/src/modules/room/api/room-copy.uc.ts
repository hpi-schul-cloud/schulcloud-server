import { Action } from '@modules/authorization';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { SagaService } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomHelperService } from '../service/room.helper';

@Injectable()
export class RoomCopyUc {
	constructor(private readonly roomHelperService: RoomHelperService, private readonly sagaService: SagaService) {}

	public async copyRoom(userId: EntityId, roomId: EntityId): Promise<CopyStatus> {
		this.roomHelperService.checkFeatureRoomsEnabled();
		this.roomHelperService.checkFeatureRoomCopyEnabled();

		await this.roomHelperService.checkRoomAuthorizationByIds(userId, roomId, Action.write, [Permission.ROOM_COPY]);

		const { roomCopied, boardsCopied } = await this.sagaService.executeSaga('roomCopy', { userId, roomId });

		const copyStatus: CopyStatus = {
			title: roomCopied.name,
			type: CopyElementType.ROOM,
			status: CopyStatusEnum.SUCCESS,
			copyEntity: {
				id: roomCopied.id,
			},
			elements: boardsCopied.map((boardItem) => {
				return {
					title: boardItem.title,
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: {
						id: boardItem.id,
					},
				};
			}),
		};

		return copyStatus;
	}
}
