import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomMember } from '../do/room-member.do';
import { RoomMemberEntity } from './entity';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';

@Injectable()
export class RoomMemberRepo {
	constructor(private readonly em: EntityManager) {}

	// TODO, update test
	async findByRoomId(roomId: EntityId): Promise<RoomMember | null> {
		const roomMemberEntities = await this.em.findOne(RoomMemberEntity, { roomId });
		if (!roomMemberEntities) return null;

		const roomMembers = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntities);

		return roomMembers;
	}

	async findByRoomIds(roomIds: EntityId[]): Promise<RoomMember[]> {
		const entities = await this.em.find(RoomMemberEntity, { roomId: { $in: roomIds } });
		const roomMembers = entities.map((entity) => RoomMemberDomainMapper.mapEntityToDo(entity));

		return roomMembers;
	}

	async save(roomMember: RoomMember | RoomMember[]): Promise<void> {
		const roomMembers = Utils.asArray(roomMember);

		roomMembers.forEach((member) => {
			const entity = RoomMemberDomainMapper.mapDoToEntity(member);
			this.em.persist(entity);
		});

		await this.em.flush();
	}

	async delete(roomMember: RoomMember | RoomMember[]): Promise<void> {
		const roomMembers = Utils.asArray(roomMember);

		roomMembers.forEach((member) => {
			const entity = RoomMemberDomainMapper.mapDoToEntity(member);
			this.em.remove(entity);
		});

		await this.em.flush();
	}
}
