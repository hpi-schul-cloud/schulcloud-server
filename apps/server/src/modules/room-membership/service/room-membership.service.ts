import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { RoleDto, RoleName, RoleService, RoomRole } from '@modules/role';
import { RoomService } from '@modules/room';
import { UserService } from '@modules/user';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RoomMembershipAuthorizable, UserWithRoomRoles } from '../do/room-membership-authorizable.do';
import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipRepo } from '../repo/room-membership.repo';
import { Pagination } from '@shared/domain/interface';
import { Page } from '@shared/domain/domainobject';
import { MemberStats, RoomMembershipStats } from '../type/room-membership-stats.type';
import { RoomMember } from '../do/room-member.do';

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

	public async getRoomMembers(roomId: EntityId): Promise<RoomMember[]> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (!roomMembership) return [];

		const group = await this.groupService.findById(roomMembership.userGroupId);
		const userIds = group.users.map((u) => u.userId);
		const users = await this.userService.findByIds(userIds);
		const roles = await this.roleService.findByIds(group.users.flatMap((u) => u.roleId));
		const validRoomMembers = users
			.map((user) => {
				const groupUser = group.users.find((g) => g.userId === user.id);
				const role = roles.find((r) => r.id === groupUser?.roleId);
				if (!role || !user.id) {
					return;
				}
				return new RoomMember({
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roomRoleId: role.id,
					roomRoleName: role.name,
					schoolId: user.schoolId,
				});
			})
			.filter((user) => user !== undefined);
		return validRoomMembers;
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
		userIds: Array<EntityId>,
		roleName: RoomRole = RoleName.ROOMVIEWER
	): Promise<RoomRole> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new Error('Room membership not found');
		}

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

	public async getRoomMembershipStatsByUsersAndRoomsSchoolId(
		schoolId: EntityId,
		pagination?: Pagination
	): Promise<Page<RoomMembershipStats>> {
		const { data, total } = await this.groupService.findByUsersAndRoomsSchoolId(schoolId, [GroupTypes.ROOM]);
		const { skip, limit } = { skip: 0, limit: 50, ...pagination };
		const groupsOnPage = data.slice(skip, skip + limit);
		const result = await this.getStats(groupsOnPage, schoolId);

		const page = new Page<RoomMembershipStats>(result, total);
		return page;
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

	private async getStats(groupsOnPage: Group[], schoolId: string): Promise<RoomMembershipStats[]> {
		const groupIds = groupsOnPage.map((group) => group.id);
		const roomMemberships = await this.roomMembershipRepo.findByGroupIds(groupIds);
		const groupIdOwnerMap = await this.getOwnerMap(groupsOnPage);

		const stats = await this.getRoomMemberStatsForGroups(schoolId, groupsOnPage);

		const result = roomMemberships.map((item) => {
			const { userGroupId, schoolId, roomId } = item;
			const stat = stats.get(userGroupId);
			const owner = groupIdOwnerMap.get(userGroupId) ?? '';
			return {
				roomId: roomId,
				roomSchoolId: schoolId,
				owner,
				totalMembers: 0,
				internalMembers: 0,
				externalMembers: 0,
				...stat,
			};
		});
		return result;
	}

	private async getOwnerMap(groupsOnPage: Group[]): Promise<Map<EntityId, string>> {
		const onwerRole = await this.roleService.findByName(RoleName.ROOMOWNER);
		const owners = groupsOnPage.map((group) => {
			const owner = group.users.find((user) => user.roleId === onwerRole.id);
			return {
				groupId: group.id,
				ownerUserId: owner?.userId,
			};
		});
		const ownerUserIds = owners.map((owner) => owner.ownerUserId).filter((id): id is EntityId => id !== undefined);
		const ownerUsers = await this.userService.findByIds(ownerUserIds);
		const groupIdOwnerMap = new Map(
			owners.map(({ groupId, ownerUserId }) => {
				const ownerUser = ownerUsers.find((user) => user.id === ownerUserId);
				const name = `${ownerUser?.firstName ?? ''} ${ownerUser?.lastName ?? ''}`.trim();
				return [groupId, name];
			})
		);
		return groupIdOwnerMap;
	}
	private async getRoomMemberStatsForGroups<T extends Group>(
		schoolId: EntityId,
		groups: T[]
	): Promise<Map<T['id'], MemberStats>> {
		const userIds = groups.flatMap((group) => group.users.map((user) => user.userId));
		const users = await this.userService.findByIds(userIds);

		const userSchoolMap = new Map(users.map((user) => [user.id, user.schoolId]));

		const statsMap = new Map(
			groups.map((group) => {
				const internalMembers = group.users.reduce((count, user) => {
					const userSchoolId = userSchoolMap.get(user.userId);
					const inc = userSchoolId === schoolId ? 1 : 0;
					return count + inc;
				}, 0);
				const totalMembers = group.users.length;
				const externalMembers = totalMembers - internalMembers;
				const memberStats: MemberStats = {
					totalMembers,
					internalMembers,
					externalMembers,
				};
				return [group.id, memberStats];
			})
		);

		return statsMap;
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
