import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLinkEntity } from '../repo/entity/room-invitation-link.entity';
import { RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { RoleName } from '@modules/role';
import { EntityFactory } from '@testing/factory/entity.factory';

const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
export const roomInvitationLinkEntityFactory = EntityFactory.define<RoomInvitationLinkEntity, RoomInvitationLinkProps>(
	RoomInvitationLinkEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			title: `room invitation link #${sequence}`,
			restrictedToSchoolId: new ObjectId().toHexString(),
			isOnlyForTeachers: true,
			activeUntil: inOneWeek,
			startingRole: RoleName.ROOMVIEWER,
			roomId: new ObjectId().toHexString(),
			createdById: new ObjectId().toHexString(),
		};
	}
);
