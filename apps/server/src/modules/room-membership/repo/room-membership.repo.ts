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
		const roomMemberEntities = await this.em.findOne(RoomMembershipEntity, { roomId });
		if (!roomMemberEntities) return null;

		const roomMembers = RoomMembershipDomainMapper.mapEntityToDo(roomMemberEntities);

		return roomMembers;
	}

	async findByRoomIds(roomIds: EntityId[]): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { roomId: { $in: roomIds } });
		const roomMembers = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMembers;
	}

	async findByGroupId(groupId: EntityId): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { userGroupId: groupId });
		const roomMembers = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMembers;
	}

	async findByGroupIds(groupIds: EntityId[]): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { userGroupId: { $in: groupIds } });
		const roomMembers = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMembers;
	}

	async save(roomMember: RoomMembership | RoomMembership[]): Promise<void> {
		const roomMembers = Utils.asArray(roomMember);

		roomMembers.forEach((member) => {
			const entity = RoomMembershipDomainMapper.mapDoToEntity(member);
			this.em.persist(entity);
		});

		await this.em.flush();
	}

	async delete(roomMember: RoomMembership | RoomMembership[]): Promise<void> {
		const roomMembers = Utils.asArray(roomMember);

		roomMembers.forEach((member) => {
			const entity = RoomMembershipDomainMapper.mapDoToEntity(member);
			this.em.remove(entity);
		});

		await this.em.flush();
	}
}
