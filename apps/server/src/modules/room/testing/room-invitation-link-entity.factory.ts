import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLinkEntity } from '../repo/entity/room-invitation-link.entity';
import { RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { EntityFactory } from '@testing/factory/entity.factory';

const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
export const roomInvitationLinkEntityFactory = EntityFactory.define<RoomInvitationLinkEntity, RoomInvitationLinkProps>(
	RoomInvitationLinkEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			title: `room invitation link #${sequence}`,
			restrictedToCreatorSchool: true,
			isOnlyForTeachers: true,
			activeUntil: inOneWeek,
			requiresConfirmation: true,
			roomId: new ObjectId().toHexString(),
			creatorUserId: new ObjectId().toHexString(),
			creatorSchoolId: new ObjectId().toHexString(),
		};
	}
);
