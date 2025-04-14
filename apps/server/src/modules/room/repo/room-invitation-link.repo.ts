import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { RoomInvitationLink } from '../domain/do/room-invitation-link.do';
import { EntityId } from '@shared/domain/types';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';

@Injectable()
export class RoomInvitationLinkRepo {
	constructor(private readonly em: EntityManager) {}

	public async findById(id: EntityId): Promise<RoomInvitationLink> {
		const entity = await this.em.findOneOrFail(RoomInvitationLinkEntity, id);
		const domainobject = this.mapEntityToDo(entity);
		return domainobject;
	}

	public async findByRoomId(roomId: EntityId): Promise<RoomInvitationLink[]> {
		const entities = await this.em.find(RoomInvitationLinkEntity, { roomId });
		const domainObjects = entities.map((entity) => this.mapEntityToDo(entity));
		return domainObjects;
	}

	public async save(roomInvitationLink: RoomInvitationLink): Promise<void> {
		const entity = await this.mapDoToEntity(roomInvitationLink);
		await this.em.persistAndFlush(entity);
	}

	public async delete(id: EntityId): Promise<void> {
		const entity = await this.em.findOneOrFail(RoomInvitationLinkEntity, id);
		await this.em.removeAndFlush(entity);
	}

	private mapEntityToDo(entity: RoomInvitationLinkEntity): RoomInvitationLink {
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

	private async mapDoToEntity(roomInvitationLink: RoomInvitationLink): Promise<RoomInvitationLinkEntity> {
		let entity = await this.em.findOne(RoomInvitationLinkEntity, roomInvitationLink.id);
		if (entity) {
			Object.assign(entity, roomInvitationLink.getProps());
		} else {
			entity = new RoomInvitationLinkEntity(roomInvitationLink.getProps());
		}
		entity.domainObject = roomInvitationLink;
		return entity;
	}
}
