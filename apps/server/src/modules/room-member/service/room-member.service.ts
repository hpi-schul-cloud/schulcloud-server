import { Forbidden } from '@feathersjs/errors';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoleRepo } from '@shared/repo';
import { Group, GroupService, GroupTypes, GroupUserEmbeddable } from '@src/modules/group';
import { RoomMember } from '../do/room-member.do';
import { RoomMemberRepo } from '../repo/room-member.repo';

@Injectable()
export class RoomMemberService {
	constructor(
		private readonly roomMembersRepo: RoomMemberRepo,
		private readonly groupService: GroupService,
		private readonly roleRepo: RoleRepo,
		private readonly em: EntityManager
	) {}

	private async createNewRoomMemberWithEditorRole(
		roomId: EntityId,
		groupUser: GroupUserEmbeddable,
		schoolId: EntityId
	) {
		const newGroup = new Group({
			name: `Room Members for Room ${roomId}`,
			externalSource: undefined,
			type: GroupTypes.ROOM,
			users: [{ userId: groupUser.user.id, roleId: groupUser.role.id }],
			id: new ObjectId().toHexString(),
			organizationId: schoolId,
		});

		await this.groupService.save(newGroup);

		const roomMember = new RoomMember({
			roomId: new ObjectId(roomId),
			userGroupId: new ObjectId(newGroup.id),
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			members: [{ userId: new ObjectId(groupUser.user.id), role: groupUser.role }],
		});

		await this.roomMembersRepo.save(roomMember);
		return roomMember;
	}

	private async addUserToRoomMember(roomMember: RoomMember, user: User, role: Role) {
		const group = await this.groupService.findById(roomMember.userGroupId.toHexString());
		if (!group) throw new Forbidden('Room member group not found');

		const groupUser = { userId: user.id, roleId: role.id };
		group.addUser(groupUser);
		await this.groupService.save(group);

		roomMember.addMember(new ObjectId(user.id), role);

		return roomMember;
	}

	public async addMemberToRoom(roomId: EntityId, user: User, roleName: RoleName): Promise<RoomMember> {
		const role = await this.roleRepo.findByName(roleName);
		const groupUser = new GroupUserEmbeddable({ role, user });
		const roomMember = await this.roomMembersRepo.findById(roomId);
		if (roomMember === null) return this.createNewRoomMemberWithEditorRole(roomId, groupUser, user.school.id);

		return this.addUserToRoomMember(roomMember, user, role);
	}
}
