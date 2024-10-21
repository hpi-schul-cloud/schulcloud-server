import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { GroupService, GroupTypes } from '@src/modules/group';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleService } from '@src/modules/role';
import { RoomMember } from '../do/room-member.do';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { RoomMemberAuthorizable, UserWithRoomRoles } from '../do/room-member-authorizable.do';

@Injectable()
export class RoomMemberService {
	constructor(
		private readonly groupService: GroupService,
		private readonly roomMembersRepo: RoomMemberRepo,
		private readonly roleService: RoleService
	) {}

	private async createNewRoomMember(
		roomId: EntityId,
		userId: EntityId,
		roleName: RoleName.ROOM_EDITOR | RoleName.ROOM_VIEWER,
		schoolId?: EntityId
	) {
		const group = await this.groupService.createGroup(`Room Members for Room ${roomId}`, GroupTypes.ROOM, schoolId);
		await this.groupService.addUserToGroup(group.id, userId, roleName);

		const roomMember = new RoomMember({
			id: new ObjectId().toHexString(),
			roomId,
			userGroupId: group.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.roomMembersRepo.save(roomMember);

		return roomMember;
	}

	public async deleteRoomMember(roomId: EntityId) {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) return;

		const group = await this.groupService.findById(roomMember.userGroupId);
		await this.groupService.delete(group);
		await this.roomMembersRepo.delete(roomMember);
	}

	public async addMemberToRoom(
		roomId: EntityId,
		userId: EntityId,
		roleName: RoleName.ROOM_EDITOR | RoleName.ROOM_VIEWER,
		schoolId?: EntityId
	): Promise<EntityId> {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) {
			const newRoomMember = await this.createNewRoomMember(roomId, userId, roleName, schoolId);
			return newRoomMember.id;
		}

		await this.groupService.addUserToGroup(roomMember.userGroupId, userId, roleName);
		return roomMember.id;
	}

	public async getRoomMemberAuthorizable(roomId: EntityId): Promise<RoomMemberAuthorizable> {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) {
			return new RoomMemberAuthorizable([]);
		}
		const group = await this.groupService.findById(roomMember.userGroupId);
		const roleSet = await this.roleService.findByIds(group.users.map((groupUser) => groupUser.roleId));

		const members = group.users.map((groupUser): UserWithRoomRoles => {
			const roleDto = roleSet.find((role) => role.id === groupUser.roleId);
			if (roleDto === undefined) throw new BadRequestException('Role not found');
			return {
				roles: [roleDto],
				userId: groupUser.userId,
			};
		});

		const roomMemberAuthorizable = new RoomMemberAuthorizable(members);

		return roomMemberAuthorizable;
	}
}
