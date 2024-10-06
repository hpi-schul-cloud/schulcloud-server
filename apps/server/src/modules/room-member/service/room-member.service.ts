import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Group, GroupService, GroupTypes } from '@src/modules/group';
import { GroupEntity, GroupEntityTypes, GroupUserEmbeddable } from '@src/modules/group/entity';
import { RoleService } from '@src/modules/role/service/role.service';
import { RoomMemberEntity } from '../repo/entity/room-member.entity';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { roomMemberEntityFactory } from '../testing';

@Injectable()
export class RoomMemberService {
	constructor(
		private readonly roomMembersRepo: RoomMemberRepo,
		private readonly groupService: GroupService,
		private readonly roleService: RoleService,
		private readonly em: EntityManager
	) {}

	private async createNewRoomMemberWithEditorRole(roomId: EntityId, groupUser: GroupUserEmbeddable) {
		const newGroup = new Group({
			name: `Room Members for Room ${roomId}`,
			externalSource: undefined,
			type: GroupTypes.OTHER,
			users: [{ userId: groupUser.user.id, roleId: groupUser.role.id }],
			id: new ObjectId().toHexString(),
		});

		const savedGroup = await this.groupService.save(newGroup);
		// TODO: add mapper to group domain
		// const groupEntityData= GroupDomainMapper.mapDoToEntityData(group, this.em);

		const groupEntity = new GroupEntity({
			name: savedGroup.name,
			type: GroupEntityTypes.OTHER,
			users: [groupUser],
		});
		const roomMember = roomMemberEntityFactory.build({
			roomId,
			userGroup: groupEntity,
		});
		const savedRoomMember = await this.roomMembersRepo.save(roomMember);
		return savedRoomMember;
	}

	private async addUserToRoomMember(roomMemberEntity: RoomMemberEntity, groupUser: GroupUserEmbeddable) {
		roomMemberEntity.userGroup.users.push(groupUser);
		return this.roomMembersRepo.save(roomMemberEntity);
	}

	public async addMemberToRoom(roomId: EntityId, user: User, roleName: RoleName) {
		const roleDto = await this.roleService.findByName(roleName);
		const role = new Role({
			name: roleDto.name,
			permissions: roleDto.permissions,
		});
		const groupUser = new GroupUserEmbeddable({ role, user });
		const roomMember = await this.roomMembersRepo.findById(roomId);
		if (roomMember === null) return this.createNewRoomMemberWithEditorRole(roomId, groupUser);
		return this.addUserToRoomMember(roomMember, groupUser);
	}
}
