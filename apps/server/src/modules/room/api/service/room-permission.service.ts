import { EntityId } from '@shared/domain/types';
import { Action, AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { RoomMembershipAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { RoomConfig } from '../../room.config';

@Injectable()
export class RoomPermissionService {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async checkRoomAuthorizationByIds(
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

	public async hasRoomPermissions(
		userId: EntityId,
		roomId: EntityId,
		action: Action,
		requiredPermissions: Permission[] = []
	): Promise<boolean> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const hasRoomPermissions = this.authorizationService.hasPermission(user, roomMembershipAuthorizable, {
			action,
			requiredPermissions,
		});

		return hasRoomPermissions;
	}

	public checkFeatureRoomsEnabled(): void {
		if (!this.configService.get('FEATURE_ROOMS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOMS_ENABLED');
		}
	}

	public checkFeatureAdministrateRoomsEnabled(): void {
		if (!this.configService.get('FEATURE_ADMINISTRATE_ROOMS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ADMINISTRATE_ROOMS_ENABLED');
		}
	}

	public checkFeatureRoomCopyEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_COPY_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_COPY_ENABLED');
		}
	}
}
