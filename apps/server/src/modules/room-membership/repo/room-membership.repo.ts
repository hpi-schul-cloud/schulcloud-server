import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipEntity } from './entity';
import { RoomMembershipDomainMapper } from './room-membership-domain.mapper';

@Injectable()
export class RoomMembershipRepo {
	constructor(private readonly em: EntityManager) {}

	async findByRoomId(roomId: EntityId): Promise<RoomMembership | null> {
		const roomMembershipEntities = await this.em.findOne(RoomMembershipEntity, { roomId });
		if (!roomMembershipEntities) return null;

		const roomMemberships = RoomMembershipDomainMapper.mapEntityToDo(roomMembershipEntities);

		return roomMemberships;
	}

	async findByRoomIds(roomIds: EntityId[]): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { roomId: { $in: roomIds } });
		const roomMemberships = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMemberships;
	}

	async findByGroupId(groupId: EntityId): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { userGroupId: groupId });
		const roomMemberships = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMemberships;
	}

	async findByGroupIds(groupIds: EntityId[]): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { userGroupId: { $in: groupIds } });
		const roomMemberships = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMemberships;
	}

	async save(roomMembership: RoomMembership | RoomMembership[]): Promise<void> {
		const roomMemberships = Utils.asArray(roomMembership);

		roomMemberships.forEach((member) => {
			const entity = RoomMembershipDomainMapper.mapDoToEntity(member);
			this.em.persist(entity);
		});

		await this.em.flush();
	}

	async delete(roomMembership: RoomMembership | RoomMembership[]): Promise<void> {
		const roomMemberships = Utils.asArray(roomMembership);

		roomMemberships.forEach((member) => {
			const entity = RoomMembershipDomainMapper.mapDoToEntity(member);
			this.em.remove(entity);
		});

		await this.em.flush();
	}
}
