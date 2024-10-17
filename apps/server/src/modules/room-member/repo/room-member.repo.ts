import { Forbidden } from '@feathersjs/errors';
import { Utils } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Group, GroupRepo, GroupTypes, GroupDomainMapper } from '@src/modules/group';
import { RoomMember } from '../do/room-member.do';
import { RoomMemberEntity } from './entity/room-member.entity';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';
import { RoomMemberScope } from './room-member.scope';

@Injectable()
export class RoomMemberRepo {
	constructor(private readonly em: EntityManager, private readonly groupRepo: GroupRepo) {}

	async findByUserId(userId: EntityId): Promise<RoomMember[]> {
		const groups = await this.groupRepo.findGroups({ userId, groupTypes: [GroupTypes.ROOM] });
		const scope = new RoomMemberScope();
		scope.byUserGroupIds(groups.data.map((group) => group.id));

		const roomEntities = await this.em.find(RoomMemberEntity, scope.query);
		const roomMembers = await Promise.all(
			roomEntities.map(async (roomEntity) => {
				const group = groups.data.find((g) => g.id === roomEntity.userGroupId.toHexString());
				if (!group) throw new Forbidden('Room member group not found');
				const groupUserEmbeddable = group.users.map((groupUsers) =>
					GroupDomainMapper.mapGroupUserToGroupUserEntity(groupUsers, this.em)
				);
				await this.em.populate(groupUserEmbeddable, true);

				return RoomMemberDomainMapper.mapEntityToDo(roomEntity, groupUserEmbeddable);
			})
		);

		return roomMembers;
	}

	async findById(id: EntityId): Promise<RoomMember | null> {
		const roomMemberEntity = await this.em.findOne(RoomMemberEntity, id);
		if (!roomMemberEntity) return null;

		const group = await this.groupRepo.findGroupById(roomMemberEntity.userGroupId.toHexString());
		if (!group) return null;

		const groupUserEmbeddable = group.users.map((groupUsers) =>
			GroupDomainMapper.mapGroupUserToGroupUserEntity(groupUsers, this.em)
		);
		await this.em.populate(groupUserEmbeddable, true);

		return RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, groupUserEmbeddable);
	}

	async findByRoomId(roomId: EntityId): Promise<RoomMember | null> {
		const entity = await this.em.findOne(RoomMemberEntity, { roomId: new ObjectId(roomId) });
		if (!entity) return null;

		const group = await this.groupRepo.findGroupById(entity.userGroupId.toHexString());
		if (!group) return null;

		const groupUserEmbeddable = group.users.map((groupUsers) =>
			GroupDomainMapper.mapGroupUserToGroupUserEntity(groupUsers, this.em)
		);
		await this.em.populate(groupUserEmbeddable, true);

		return RoomMemberDomainMapper.mapEntityToDo(entity, groupUserEmbeddable);
	}

	async findByRoomIds(roomIds: EntityId[]): Promise<RoomMember[]> {
		const scope = new RoomMemberScope();
		scope.byRoomIds(roomIds);

		const entities = await this.em.find(RoomMemberEntity, scope.query);

		const members = await Promise.all(
			entities.map(async (entity) => {
				const group = await this.groupRepo.findGroupById(entity.userGroupId.toHexString());
				if (!group) throw new Forbidden('Room member group not found');

				const groupUserEmbeddable = group.users.map((groupUsers) =>
					GroupDomainMapper.mapGroupUserToGroupUserEntity(groupUsers, this.em)
				);
				await this.em.populate(groupUserEmbeddable, true);

				return RoomMemberDomainMapper.mapEntityToDo(entity, groupUserEmbeddable);
			})
		);

		return members;
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

		// group deletion should be propagated via event bus to group module
		await Promise.all(
			roomMembers.map((item) => {
				const groupToDelete = new Group({
					id: item.userGroupId.toHexString(),
					name: '',
					type: GroupTypes.ROOM,
					users: [],
				});

				return this.groupRepo.delete(groupToDelete);
			})
		);

		roomMembers.forEach((member) => {
			const entity = RoomMemberDomainMapper.mapDoToEntity(member);
			this.em.remove(entity);
		});

		await this.em.flush();
	}
}
