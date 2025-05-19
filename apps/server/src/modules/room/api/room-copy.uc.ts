import { Action, AuthorizationService } from '@modules/authorization';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { SagaService } from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomService } from '../domain';
import { RoomConfig } from '../room.config';
import { ValidationError } from '@shared/common/error';

@Injectable()
export class RoomCopyUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly sagaService: SagaService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async copyRoom(userId: EntityId, roomId: EntityId): Promise<CopyStatus> {
		this.checkFeatureRoomsEnabled();
		this.checkFeatureRoomCopyEnabled();

		await this.checkRoomAuthorizationByIds(userId, roomId, Action.write, [Permission.ROOM_COPY]);

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

	private checkFeatureRoomsEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}

	private checkFeatureRoomCopyEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_COPY_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_COPY_ENABLED');
		}
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
}
