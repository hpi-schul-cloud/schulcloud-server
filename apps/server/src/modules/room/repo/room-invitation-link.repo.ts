import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { RoomInvitationLink } from '../domain/do/room-invitation-link.do';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';
import { RoomInvitationLinkDomainMapper } from './room-invitation-link-domain.mapper';

@Injectable()
export class RoomInvitationLinkRepo {
	constructor(
		private readonly em: EntityManager,
		private readonly roomInvitationLinkDomainMapper: RoomInvitationLinkDomainMapper
	) {}

	public async findById(id: EntityId): Promise<RoomInvitationLink> {
		const entity = await this.em.findOneOrFail(RoomInvitationLinkEntity, id);
		const domainobject = this.roomInvitationLinkDomainMapper.mapEntityToDo(entity);
		return domainobject;
	}

	public async findByRoomId(roomId: EntityId): Promise<RoomInvitationLink[]> {
		const entities = await this.em.find(RoomInvitationLinkEntity, { roomId });
		const domainObjects = entities.map((entity) => this.roomInvitationLinkDomainMapper.mapEntityToDo(entity));
		return domainObjects;
	}

	public async save(roomInvitationLink: RoomInvitationLink): Promise<void> {
		const entity = await this.roomInvitationLinkDomainMapper.mapDoToEntity(roomInvitationLink);
		await this.em.persistAndFlush(entity);
	}

	public async delete(id: EntityId): Promise<void> {
		const entity = await this.em.findOneOrFail(RoomInvitationLinkEntity, id);
		await this.em.removeAndFlush(entity);
	}
}
