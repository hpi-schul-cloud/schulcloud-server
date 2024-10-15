import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoleRepo } from '@shared/repo';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { Group, GroupService, GroupTypes } from '@src/modules/group';
import { GroupEntity, GroupEntityTypes, GroupUserEmbeddable } from '@src/modules/group/entity';
import { RoomMemberEntity } from '../repo/entity/room-member.entity';
import { RoomMemberRepo } from '../repo/room-member.repo';
import { roomMemberEntityFactory } from '../testing';

@Injectable()
export class RoomMemberService {
	constructor(
		private readonly roomMembersRepo: RoomMemberRepo,
		private readonly groupService: GroupService,
		private readonly roleRepo: RoleRepo,
		private readonly em: EntityManager,
		private readonly authorizationService: AuthorizationService
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

	public async hasAuthorization(roomId: EntityId, user: User, action: Action) {
		const roomMember = await this.roomMembersRepo.findByRoomId(roomId);
		if (roomMember === null) return false;
		return this.authorizationService.hasPermission(user, roomMember, { requiredPermissions: [], action });
	}

	public async batchHasAuthorization(
		roomIds: EntityId[],
		user: User,
		action: Action
	): Promise<{ roomId: EntityId; hasAuthorization: boolean }[]> {
		const roomMembers = await this.roomMembersRepo.findByRoomIds(roomIds);
		return roomMembers.map((roomMember) => {
			return {
				roomId: roomMember.roomId.toHexString(),
				hasAuthorization: this.authorizationService.hasPermission(user, roomMember, {
					requiredPermissions: [],
					action,
				}),
			};
		});
	}

	public async addMemberToRoom(roomId: EntityId, user: User, roleName: RoleName) {
		const role = await this.roleRepo.findByName(roleName);
		const groupUser = new GroupUserEmbeddable({ role, user });
		const roomMember = await this.roomMembersRepo.findById(roomId);
		if (roomMember === null) return this.createNewRoomMemberWithEditorRole(roomId, groupUser);

		return this.addUserToRoomMember(roomMember, groupUser);
	}
}
