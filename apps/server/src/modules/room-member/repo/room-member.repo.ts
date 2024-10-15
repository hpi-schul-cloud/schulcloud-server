import { Utils } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomMemberEntity } from './entity/room-member.entity';
import { RoomMemberScope } from './room-member.scope';

@Injectable()
export class RoomMemberRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<RoomMemberEntity | null> {
		return this.em.findOne(RoomMemberEntity, id, {
			populate: ['userGroup', 'userGroup.users.user', 'userGroup.users.role'],
		});
	}

	async findByRoomId(roomId: EntityId): Promise<RoomMemberEntity | null> {
		return this.em.findOne(
			RoomMemberEntity,
			{ roomId: new ObjectId(roomId) },
			{
				populate: ['userGroup', 'userGroup.users.user', 'userGroup.users.role'],
			}
		);
	}

	async findByRoomIds(roomIds: EntityId[]): Promise<RoomMemberEntity[]> {
		const scope = new RoomMemberScope();
		scope.byRoomIds(roomIds);
		return this.em.find(RoomMemberEntity, scope.query, {
			populate: ['userGroup', 'userGroup.users.user', 'userGroup.users.role'],
		});
	}

	async save(roomMember: RoomMemberEntity | RoomMemberEntity[]): Promise<void> {
		const members = Utils.asArray(roomMember);

		members.forEach((member) => {
			this.em.persist(member);
		});

		await this.em.flush();
	}

	async delete(roomMember: RoomMemberEntity | RoomMemberEntity[]): Promise<void> {
		const members = Utils.asArray(roomMember);

		members.forEach((member) => {
			this.em.remove(member);
		});

		await this.em.flush();
	}
}
