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

	public async findByIds(ids: EntityId[]): Promise<RoomInvitationLink[]> {
		const entities = await this.em.find(RoomInvitationLinkEntity, { id: { $in: ids } });
		const domainobjects = entities.map((entity) => this.roomInvitationLinkDomainMapper.mapEntityToDo(entity));
		return domainobjects;
	}

	public async findByRoomId(roomId: EntityId): Promise<RoomInvitationLink[]> {
		const entities = await this.em.find(RoomInvitationLinkEntity, { roomId });
		const domainObjects = entities.map((entity) => this.roomInvitationLinkDomainMapper.mapEntityToDo(entity));
		return domainObjects;
	}

	public async save(roomInvitationLink: RoomInvitationLink): Promise<void> {
		const entity = await this.roomInvitationLinkDomainMapper.mapDoToEntity(roomInvitationLink);
		await this.em.persist(entity).flush();
	}

	public async delete(ids: EntityId[]): Promise<void> {
		const entities = await this.em.find(RoomInvitationLinkEntity, { id: { $in: ids } });
		const promises = entities.map((entity) => this.em.remove(entity));
		await Promise.all(promises);
		await this.em.flush();
	}
}
