import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { RoleDto, RoleService } from '@modules/role';
import { UserService } from '@modules/user';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomService } from '@src/modules/room/domain';
import { RoomMembershipAuthorizable, UserWithRoomRoles } from '../do/room-membership-authorizable.do';
import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipRepo } from '../repo/room-membership.repo';

@Injectable()
export class RoomMembershipService {
	constructor(
		private readonly groupService: GroupService,
		private readonly roomMembershipRepo: RoomMembershipRepo,
		private readonly roleService: RoleService,
		private readonly roomService: RoomService,
		private readonly userService: UserService
	) {}

	public async createNewRoomMembership(roomId: EntityId, ownerUserId: EntityId): Promise<RoomMembership> {
		const room = await this.roomService.getSingleRoom(roomId);

		const group = await this.groupService.createGroup(
			`Room Members for Room ${roomId}`,
			GroupTypes.ROOM,
			room.schoolId
		);
		await this.groupService.addUsersToGroup(group.id, [{ userId: ownerUserId, roleName: RoleName.ROOMOWNER }]);

		const roomMembership = new RoomMembership({
			id: new ObjectId().toHexString(),
			roomId,
			userGroupId: group.id,
			schoolId: room.schoolId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.roomMembershipRepo.save(roomMembership);

		return roomMembership;
	}

	private buildRoomMembershipAuthorizable(
		roomId: EntityId,
		group: Group,
		roleSet: RoleDto[],
		schoolId: EntityId
	): RoomMembershipAuthorizable {
		const members = group.users.map((groupUser): UserWithRoomRoles => {
			const roleDto = roleSet.find((role) => role.id === groupUser.roleId);
			if (roleDto === undefined) throw new BadRequestException('Role not found');
			return {
				roles: [roleDto],
				userId: groupUser.userId,
			};
		});

		const roomMembershipAuthorizable = new RoomMembershipAuthorizable(roomId, members, schoolId);

		return roomMembershipAuthorizable;
	}

	public async deleteRoomMembership(roomId: EntityId): Promise<void> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) return;

		const group = await this.groupService.findById(roomMembership.userGroupId);
		await this.groupService.delete(group);
		await this.roomMembershipRepo.delete(roomMembership);
	}

	public async addMembersToRoom(
		roomId: EntityId,
		userIdsAndRoles: Array<{
			userId: EntityId;
			roleName: RoleName.ROOMADMIN | RoleName.ROOMEDITOR | RoleName.ROOMVIEWER;
		}>
	): Promise<EntityId> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new Error('Room membership not found');
		}

		await this.groupService.addUsersToGroup(roomMembership.userGroupId, userIdsAndRoles);

		const userIds = userIdsAndRoles.map((user) => user.userId);
		await this.userService.addSecondarySchoolToUsers(userIds, roomMembership.schoolId);

		return roomMembership.id;
	}

	public async removeMembersFromRoom(roomId: EntityId, userIds: EntityId[]): Promise<void> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new BadRequestException('Room member not found');
		}

		const group = await this.groupService.findById(roomMembership.userGroupId);

		// TODO: fail if trying to remove owner
		// const hasOwner = group.users
		// 	.filter((user) => userIds.includes(user.userId))
		// 	.some((groupUser) => groupUser.roleName === RoleName.ROOMOWNER);

		await this.groupService.removeUsersFromGroup(group.id, userIds);

		await this.handleGuestRoleRemoval(userIds, roomMembership.schoolId);
	}

	public async getRoomMembershipAuthorizablesByUserId(userId: EntityId): Promise<RoomMembershipAuthorizable[]> {
		const groupPage = await this.groupService.findGroups({ userId, groupTypes: [GroupTypes.ROOM] });
		const groupIds = groupPage.data.map((group) => group.id);
		const roomMemberships = await this.roomMembershipRepo.findByGroupIds(groupIds);
		const roleIds = groupPage.data.flatMap((group) => group.users.map((groupUser) => groupUser.roleId));
		const roleSet = await this.roleService.findByIds(roleIds);
		const roomMembershipAuthorizables = roomMemberships
			.map((item) => {
				const group = groupPage.data.find((g) => g.id === item.userGroupId);
				if (!group) return null;
				return this.buildRoomMembershipAuthorizable(item.roomId, group, roleSet, item.schoolId);
			})
			.filter((item): item is RoomMembershipAuthorizable => item !== null);

		return roomMembershipAuthorizables;
	}

	public async getRoomMembershipAuthorizable(roomId: EntityId): Promise<RoomMembershipAuthorizable> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			const room = await this.roomService.getSingleRoom(roomId);
			return new RoomMembershipAuthorizable(roomId, [], room.schoolId);
		}
		const group = await this.groupService.findById(roomMembership.userGroupId);
		const roleSet = await this.roleService.findByIds(group.users.map((groupUser) => groupUser.roleId));

		const members = group.users.map((groupUser): UserWithRoomRoles => {
			const roleDto = roleSet.find((role) => role.id === groupUser.roleId);
			if (roleDto === undefined) throw new BadRequestException('Role not found');
			return {
				roles: [roleDto],
				userId: groupUser.userId,
			};
		});

		const roomMembershipAuthorizable = new RoomMembershipAuthorizable(roomId, members, roomMembership.schoolId);

		return roomMembershipAuthorizable;
	}

	private async handleGuestRoleRemoval(userIds: EntityId[], schoolId: EntityId): Promise<void> {
		const { data: groups } = await this.groupService.findGroups({ userIds, groupTypes: [GroupTypes.ROOM], schoolId });

		const userIdsInGroups = groups.flatMap((group) => group.users.map((groupUser) => groupUser.userId));
		const removeUserIds = userIds.filter((userId) => !userIdsInGroups.includes(userId));

		if (removeUserIds.length > 0) {
			await this.userService.removeSecondarySchoolFromUsers(removeUserIds, schoolId);
		}
	}
}
