import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { RoleName, RoleService, RoomRole } from '@modules/role';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig, RoomService } from '@modules/room';
import { RoomInvitationLink } from '@modules/room/domain/do/room-invitation-link.do';
import { SchoolService } from '@modules/school/domain/service/school.service';
import { UserService } from '@modules/user';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InspectPerformance } from '@shared/common/measure-utils';
import { Page } from '@shared/domain/domainobject';
import { Pagination } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomAuthorizable } from '../do/room-authorizable.do';
import { RoomInvitationLinkAuthorizable } from '../do/room-invitation-link-authorizable.do';
import { RoomMember } from '../do/room-member.do';
import { RoomMembership } from '../do/room-membership.do';
import { RoomMembershipRepo } from '../repo/room-membership.repo';
import { MemberStats, RoomMembershipStats } from '../type/room-membership-stats.type';

@Injectable()
export class RoomMembershipService {
	constructor(
		private readonly groupService: GroupService,
		private readonly roomMembershipRepo: RoomMembershipRepo,
		private readonly roleService: RoleService,
		private readonly roomService: RoomService,
		private readonly userService: UserService,
		private readonly schoolService: SchoolService,
		@Inject(ROOM_PUBLIC_API_CONFIG_TOKEN) private readonly roomConfig: RoomPublicApiConfig
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
					schoolRoleNames: user.roles.map((role) => role.name),
				});
			})
			.filter((user) => user !== undefined);
		return validRoomMembers;
	}

	public async deleteRoomMembership(roomId: EntityId): Promise<void> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) return;

		const group = await this.groupService.findById(roomMembership.userGroupId);
		const userIds = group.users.map((user) => user.userId);

		await this.groupService.delete(group);
		await this.roomMembershipRepo.delete(roomMembership);

		await this.handleGuestRoleRemoval(userIds, roomMembership.schoolId);
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

	@InspectPerformance()
	public async getRoomAuthorizablesByUserId(userId: EntityId): Promise<RoomAuthorizable[]> {
		const groups = await this.getAllRoomGroupsOfUser(userId);
		const groupIds = groups.map((group) => group.id);
		const roomMemberships = await this.roomMembershipRepo.findByGroupIds(groupIds);
		return await this.getAuthorizables(groups, roomMemberships);
	}

	public async getRoomAuthorizable(roomId: EntityId): Promise<RoomAuthorizable> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			const room = await this.roomService.getSingleRoom(roomId);
			return new RoomAuthorizable(roomId, [], room.schoolId);
		}
		const group = await this.groupService.findById(roomMembership.userGroupId);
		const roomAuthorizables = await this.getAuthorizables([group], [roomMembership]);

		return roomAuthorizables[0];
	}

	public async getRoomInvitationLinkAuthorizable(
		roomInvitationLink: RoomInvitationLink
	): Promise<RoomInvitationLinkAuthorizable> {
		const { creatorSchoolId, roomId } = roomInvitationLink;

		const creatorSchool = await this.schoolService.getSchoolById(creatorSchoolId);
		const roomAuthorizable = await this.getRoomAuthorizable(roomId);

		return new RoomInvitationLinkAuthorizable(
			roomAuthorizable,
			roomInvitationLink,
			creatorSchool.name,
			this.roomConfig
		);
	}

	@InspectPerformance()
	private async getAuthorizables(groups: Group[], roomMemberships: RoomMembership[]): Promise<RoomAuthorizable[]> {
		const userIds = [...groups.flatMap((group) => group.users.map((user) => user.userId))];
		const userSchoolMap = await this.userService.getSchoolIdsByUserIds(userIds);

		const roleDtos = await this.roleService.findAll();

		const roomAuthorizables: RoomAuthorizable[] = [];
		for (const roomMembership of roomMemberships) {
			const group = groups.find((g) => g.id === roomMembership.userGroupId);
			if (!group) continue;
			const members =
				group.users.map((groupUser) => {
					const roles = roleDtos.filter((role) => groupUser.roleId === role.id);
					return {
						userId: groupUser.userId,
						roles,
						userSchoolId: userSchoolMap.get(groupUser.userId) ?? '',
					};
				}) ?? [];
			roomAuthorizables.push(new RoomAuthorizable(roomMembership.roomId, members, roomMembership.schoolId));
		}
		return roomAuthorizables;
	}

	@InspectPerformance()
	private async getAllRoomGroupsOfUser(userId: EntityId): Promise<Group[]> {
		const { data } = await this.groupService.findGroups({
			groupTypes: [GroupTypes.ROOM],
			userId,
		});

		return data;
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
