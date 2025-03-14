import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { RoleDto, RoleName, RoleService, RoomRole } from '@modules/role';
import { RoomService } from '@modules/room';
import { UserService } from '@modules/user';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { RoomMembershipAuthorizable, UserWithRoomRoles } from '../do/room-membership-authorizable.do';
import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipRepo } from '../repo/room-membership.repo';
import { RoomMembershipConfig } from '../room-membership-config';

@Injectable()
export class RoomMembershipService {
	constructor(
		private readonly groupService: GroupService,
		private readonly roomMembershipRepo: RoomMembershipRepo,
		private readonly roleService: RoleService,
		private readonly roomService: RoomService,
		private readonly userService: UserService,
		private readonly configService: ConfigService<RoomMembershipConfig, true>
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

	public async addMembersToRoom(roomId: EntityId, userIds: Array<EntityId>): Promise<RoomRole> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new Error('Room membership not found');
		}

		const roleName = this.configService.get('FEATURE_ROOMS_CHANGE_PERMISSIONS_ENABLED')
			? RoleName.ROOMVIEWER
			: RoleName.ROOMADMIN;

		const userIdsAndRoles = userIds.map((userId) => {
			return { userId, roleName };
		});
		await this.groupService.addUsersToGroup(roomMembership.userGroupId, userIdsAndRoles);

		await this.userService.addSecondarySchoolToUsers(userIds, roomMembership.schoolId);

		return roleName;
	}

	public async removeMembersFromRoom(roomId: EntityId, userIds: EntityId[]): Promise<void> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new BadRequestException('Room membership not found');
		}

		const group = await this.groupService.findById(roomMembership.userGroupId);

		await this.ensureOwnerIsNotRemoved(group, userIds);
		await this.groupService.removeUsersFromGroup(group.id, userIds);

		await this.handleGuestRoleRemoval(userIds, roomMembership.schoolId);
	}

	public async changeRoleOfRoomMembers(roomId: EntityId, userIds: EntityId[], roleName: RoleName): Promise<void> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new BadRequestException('Room membership not found');
		}

		const [group, role] = await Promise.all([
			this.groupService.findById(roomMembership.userGroupId),
			this.roleService.findByName(roleName),
		]);

		group.users.forEach((groupUser) => {
			if (userIds.includes(groupUser.userId)) {
				groupUser.roleId = role.id;
			}
		});

		await this.groupService.save(group);
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

	private async ensureOwnerIsNotRemoved(group: Group, userIds: EntityId[]): Promise<void> {
		const role = await this.roleService.findByName(RoleName.ROOMOWNER);
		const includedOwner = group.users
			.filter((groupUser) => userIds.includes(groupUser.userId))
			.find((groupUser) => groupUser.roleId === role.id);

		if (includedOwner) {
			throw new BadRequestException('Cannot remove owner from room');
		}
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
