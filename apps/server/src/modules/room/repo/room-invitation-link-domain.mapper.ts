import { EntityManager } from '@mikro-orm/mongodb';
import { RoomInvitationLink } from '../domain/do/room-invitation-link.do';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';
import { Injectable } from '@nestjs/common';
import { RoomInvitationLinkFactory } from '../domain/factory/room-invitation-link.factory';

@Injectable()
export class RoomInvitationLinkDomainMapper {
	constructor(private readonly em: EntityManager) {}

	public mapEntityToDo(entity: RoomInvitationLinkEntity): RoomInvitationLink {
		if (entity.domainObject) {
			return entity.domainObject;
		}

		const roomInvitationLink = RoomInvitationLinkFactory.buildFromProps(entity);

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
