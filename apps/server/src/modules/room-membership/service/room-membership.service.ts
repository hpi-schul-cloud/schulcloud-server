import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleDto, RoleService } from '@modules/role';
import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipRepo } from '../repo/room-membership.repo';
import { RoomMembershipAuthorizable, UserWithRoomRoles } from '../do/room-membership-authorizable.do';

@Injectable()
export class RoomMembershipService {
	constructor(
		private readonly groupService: GroupService,
		private readonly roomMembersRepo: RoomMembershipRepo,
		private readonly roleService: RoleService
	) {}

	private async createNewRoomMember(
		roomId: EntityId,
		userId: EntityId,
		roleName: RoleName.ROOMEDITOR | RoleName.ROOMVIEWER,
		schoolId?: EntityId
	) {
		const group = await this.groupService.createGroup(`Room Members for Room ${roomId}`, GroupTypes.ROOM, schoolId);
		await this.groupService.addUsersToGroup(group.id, [{ userId, roleName }]);

		const roomMember = new RoomMembership({
			id: new ObjectId().toHexString(),
			roomId,
			userGroupId: group.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.roomMembersRepo.save(roomMember);

		return roomMember;
	}

	private buildRoomMembershipAuthorizable(
		roomId: EntityId,
		group: Group,
		roleSet: RoleDto[]
	): RoomMembershipAuthorizable {
		const members = group.users.map((groupUser): UserWithRoomRoles => {
			const roleDto = roleSet.find((role) => role.id === groupUser.roleId);
			if (roleDto === undefined) throw new BadRequestException('Role not found');
			return {
				roles: [roleDto],
				userId: groupUser.userId,
			};
		});

		const roomMembershipAuthorizable = new RoomMembershipAuthorizable(roomId, members);

		return roomMembershipAuthorizable;
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
		userIdsAndRoles: Array<{ userId: EntityId; roleName: RoleName.ROOMEDITOR | RoleName.ROOMVIEWER }>,
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

	public async removeMembersFromRoom(roomId: EntityId, userIds: EntityId[]): Promise<void> {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) {
			throw new BadRequestException('Room member not found');
		}

		const group = await this.groupService.findById(roomMember.userGroupId);
		await this.groupService.removeUsersFromGroup(group.id, userIds);
	}

	public async getRoomMembershipAuthorizablesByUserId(userId: EntityId): Promise<RoomMembershipAuthorizable[]> {
		const groupPage = await this.groupService.findGroups({ userId, groupTypes: [GroupTypes.ROOM] });
		const groupIds = groupPage.data.map((group) => group.id);
		const roomMembers = await this.roomMembersRepo.findByGroupIds(groupIds);
		const roleIds = groupPage.data.flatMap((group) => group.users.map((groupUser) => groupUser.roleId));
		const roleSet = await this.roleService.findByIds(roleIds);
		const roomMembershipAuthorizables = roomMembers
			.map((item) => {
				const group = groupPage.data.find((g) => g.id === item.userGroupId);
				if (!group) return null;
				return this.buildRoomMembershipAuthorizable(item.roomId, group, roleSet);
			})
			.filter((item): item is RoomMembershipAuthorizable => item !== null);

		return roomMembershipAuthorizables;
	}

	public async getRoomMembershipAuthorizable(roomId: EntityId): Promise<RoomMembershipAuthorizable> {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) {
			return new RoomMembershipAuthorizable(roomId, []);
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

		const roomMembershipAuthorizable = new RoomMembershipAuthorizable(roomId, members);

		return roomMembershipAuthorizable;
	}
}
