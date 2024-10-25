import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Group, GroupService, GroupTypes } from '@src/modules/group';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleDto, RoleService } from '@src/modules/role';
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
		await this.groupService.addUsersToGroup(group.id, [{ userId, roleName }]);

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

	private static buildRoomMemberAuthorizable(
		roomId: EntityId,
		group: Group,
		roleSet: RoleDto[]
	): RoomMemberAuthorizable {
		const members = group.users.map((groupUser): UserWithRoomRoles => {
			const roleDto = roleSet.find((role) => role.id === groupUser.roleId);
			if (roleDto === undefined) throw new BadRequestException('Role not found');
			return {
				roles: [roleDto],
				userId: groupUser.userId,
			};
		});

		const roomMemberAuthorizable = new RoomMemberAuthorizable(roomId, members);

		return roomMemberAuthorizable;
	}

	public async deleteRoomMember(roomId: EntityId) {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) return;

		const group = await this.groupService.findById(roomMember.userGroupId);
		await this.groupService.delete(group);
		await this.roomMembersRepo.delete(roomMember);
	}

	public async addMembersToRoom(
		roomId: EntityId,
		userIdsAndRoles: Array<{ userId: EntityId; roleName: RoleName.ROOM_EDITOR | RoleName.ROOM_VIEWER }>,
		schoolId?: EntityId
	): Promise<EntityId> {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) {
			const firstUser = userIdsAndRoles.pop();
			if (firstUser === undefined) {
				throw new BadRequestException('No user provided');
			}
			const newRoomMember = await this.createNewRoomMember(roomId, firstUser.userId, firstUser.roleName, schoolId);
			return newRoomMember.id;
		}

		await this.groupService.addUsersToGroup(roomMember.userGroupId, userIdsAndRoles);

    return roomMember.id;
	}

	public async getRoomMemberAuthorizablesByUserId(userId: EntityId): Promise<RoomMemberAuthorizable[]> {
		const groupPage = await this.groupService.findGroups({ userId, groupTypes: [GroupTypes.ROOM] });
		const groupIds = groupPage.data.map((group) => group.id);
		const roomMembers = await this.roomMembersRepo.findByGroupIds(groupIds);
		const roleIds = groupPage.data.flatMap((group) => group.users.map((groupUser) => groupUser.roleId));
		const roleSet = await this.roleService.findByIds(roleIds);
		const roomMemberAuthorizables = roomMembers
			.map((item) => {
				const group = groupPage.data.find((g) => g.id === item.userGroupId);
				if (!group) return null;
				return RoomMemberService.buildRoomMemberAuthorizable(item.roomId, group, roleSet);
			})
			.filter((item): item is RoomMemberAuthorizable => item !== null);

		return roomMemberAuthorizables;
	}

	public async getRoomMemberAuthorizable(roomId: EntityId): Promise<RoomMemberAuthorizable> {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) {
			return new RoomMemberAuthorizable(roomId, []);
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

		const roomMemberAuthorizable = new RoomMemberAuthorizable(roomId, members);

		return roomMemberAuthorizable;
	}
}
