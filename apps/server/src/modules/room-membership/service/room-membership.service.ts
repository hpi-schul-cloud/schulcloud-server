import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { RoleDto, RoleService } from '@modules/role';
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
		private readonly roomService: RoomService
	) {}

	private async createNewRoomMembership(
		roomId: EntityId,
		userId: EntityId,
		roleName: RoleName.ROOMEDITOR | RoleName.ROOMVIEWER
	) {
		const room = await this.roomService.getSingleRoom(roomId);

		const group = await this.groupService.createGroup(
			`Room Members for Room ${roomId}`,
			GroupTypes.ROOM,
			room.schoolId
		);
		await this.groupService.addUsersToGroup(group.id, [{ userId, roleName }]);

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

	public async deleteRoomMembership(roomId: EntityId) {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) return;

		const group = await this.groupService.findById(roomMembership.userGroupId);
		await this.groupService.delete(group);
		await this.roomMembershipRepo.delete(roomMembership);
	}

	public async addMembersToRoom(
		roomId: EntityId,
		userIdsAndRoles: Array<{ userId: EntityId; roleName: RoleName.ROOMEDITOR | RoleName.ROOMVIEWER }>
	): Promise<EntityId> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			const firstUser = userIdsAndRoles.shift();
			if (firstUser === undefined) {
				throw new BadRequestException('No user provided');
			}
			const newRoomMembership = await this.createNewRoomMembership(roomId, firstUser.userId, firstUser.roleName);
			return newRoomMembership.id;
		}

		await this.groupService.addUsersToGroup(roomMembership.userGroupId, userIdsAndRoles);

		return roomMembership.id;
	}

	public async removeMembersFromRoom(roomId: EntityId, userIds: EntityId[]): Promise<void> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			throw new BadRequestException('Room member not found');
		}

		const group = await this.groupService.findById(roomMembership.userGroupId);
		await this.groupService.removeUsersFromGroup(group.id, userIds);
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
				return this.buildRoomMembershipAuthorizable(item.roomId, group, roleSet);
			})
			.filter((item): item is RoomMembershipAuthorizable => item !== null);

		return roomMembershipAuthorizables;
	}

	public async getRoomMembershipAuthorizable(roomId: EntityId): Promise<RoomMembershipAuthorizable> {
		const roomMembership = await this.roomMembershipRepo.findByRoomId(roomId);
		if (roomMembership === null) {
			return new RoomMembershipAuthorizable(roomId, []);
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

		const roomMembershipAuthorizable = new RoomMembershipAuthorizable(roomId, members);

		return roomMembershipAuthorizable;
	}
}
