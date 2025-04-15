import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLink } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkRepo } from '../repo/room-invitation-link.repo';
import { RoomConfig } from '../room.config';

@Injectable()
export class RoomInvitationLinkUc {
	constructor(
		private readonly configService: ConfigService<RoomConfig, true>,
		private readonly roomInvitationLinkRepo: RoomInvitationLinkRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getRoomInvitationLinkById(userId: EntityId, linkId: EntityId): Promise<RoomInvitationLink> {
		this.checkFeatureEnabled();
		const roomInvitationLink = this.roomInvitationLinkRepo.findById(linkId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkOneOfPermissions(user, [Permission.ROOM_CREATE]);

		return roomInvitationLink;
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_ROOM_INVITATION_LINKS_ENABLED', { infer: true })) {
			throw new FeatureDisabledLoggableException('FEATURE_ROOM_INVITATION_LINKS_ENABLED');
		}
	}
}
