import { EntityManager } from '@mikro-orm/mongodb';
import { RoomInvitationLink } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomInvitationLinkDomainMapper {
	constructor(private readonly em: EntityManager) {}

	public mapEntityToDo(entity: RoomInvitationLinkEntity): RoomInvitationLink {
		if (entity.domainObject) {
			return entity.domainObject;
		}

		const roomInvitationLink = new RoomInvitationLink({
			id: entity.id,
			title: entity.title,
			restrictedToSchoolId: entity.restrictedToSchoolId,
			isOnlyForTeachers: entity.isOnlyForTeachers,
			activeUntil: entity.activeUntil,
			startingRole: entity.startingRole,
			roomId: entity.roomId,
			createdById: entity.createdById,
		});
		entity.domainObject = roomInvitationLink;
		return roomInvitationLink;
	}

	public async mapDoToEntity(roomInvitationLink: RoomInvitationLink): Promise<RoomInvitationLinkEntity> {
		let entity = await this.em.findOne(RoomInvitationLinkEntity, roomInvitationLink.id);
		if (entity) {
			Object.assign(entity, roomInvitationLink.getProps());
		} else {
			entity = new RoomInvitationLinkEntity();
			Object.assign(entity, roomInvitationLink.getProps());
		}
		entity.domainObject = roomInvitationLink;
		return entity;
	}
}
