import { ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLinkEntity } from '../repo/entity/room-invitation-link.entity';
import { RoomInvitationLinkProps } from '../domain/do/room-invitation-link.do';
import { RoleName } from '@modules/role';
import { BaseFactory } from '@testing/factory/base.factory';

class RoomInvitationLinkEntityFactory extends BaseFactory<RoomInvitationLinkEntity, RoomInvitationLinkProps> {}

export const roomInvitationLinkEntityFactory = RoomInvitationLinkEntityFactory.define(
	RoomInvitationLinkEntity,
	({ sequence }) =>
		new RoomInvitationLinkEntity({
			id: new ObjectId().toHexString(),
			title: `room #${sequence}`,
			restrictedToSchoolId: new ObjectId().toHexString(),
			isOnlyForTeachers: true,
			activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
			startingRole: RoleName.ROOMVIEWER,
			roomId: new ObjectId().toHexString(),
			createdById: new ObjectId().toHexString(),
		})
);
