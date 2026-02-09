import { AuthorizationService } from '@modules/authorization';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { RoomMembershipService } from '@modules/room-membership';
import { RoomRule } from '@modules/room-membership/authorization/room.rule';
import { SagaService } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { RoomConfig } from '../room.config';

@Injectable()
export class RoomCopyUc {
	constructor(
		private readonly sagaService: SagaService,
		private readonly roomRule: RoomRule,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly authorizationService: AuthorizationService,
		private readonly configService: ConfigService<RoomConfig, true>
	) {}

	public async copyRoom(userId: EntityId, roomId: EntityId): Promise<CopyStatus> {
		this.checkFeatureRoomCopyEnabled();
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		throwForbiddenIfFalse(this.roomRule.canCopyRoom(user, roomAuthorizable));

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

	private checkFeatureRoomCopyEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_COPY_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_COPY_ENABLED');
		}
	}
}
