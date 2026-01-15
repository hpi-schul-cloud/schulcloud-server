import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { RoleName } from '@modules/role';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';

@Injectable()
export class RoomMembershipRule implements Rule<RoomMembershipAuthorizable> {
	constructor(private readonly authorisationInjectionService: AuthorizationInjectionService) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(_: User, object: unknown): boolean {
		const isMatched = object instanceof RoomMembershipAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomMembershipAuthorizable, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const roomPermissions = this.resolveRoomPermissions(user, object);

		if (!this.hasAccessToSchool(user, object.schoolId)) {
			return false;
		}

		if (!this.hasRequiredRoomPermissions(roomPermissions, requiredPermissions)) {
			return false;
		}

		if (action === Action.read) {
			return roomPermissions.includes(Permission.ROOM_LIST_CONTENT);
		}
		return roomPermissions.includes(Permission.ROOM_EDIT_CONTENT);
	}

	public canCreateRoom(user: User): boolean {
		if (!this.hasAccessToSchool(user, user.school.id)) {
			return false;
		}
		const schoolPermissions = this.resolveSchoolPermissions(user);

		const result = schoolPermissions.includes(Permission.SCHOOL_CREATE_ROOM);

		return result;
	}

	public canAccessRoom(user: User, roomMembershipAuthorizable: RoomMembershipAuthorizable): boolean {
		const { schoolPermissions, roomPermissions } = this.resolveUserPermissions(user, roomMembershipAuthorizable);
		const hasAdminPermission = schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);

		if (!hasAdminPermission) {
			const hasRoomOwner = roomMembershipAuthorizable.members.some((member) =>
				member.roles.some((role) => role.name === RoleName.ROOMOWNER)
			);
			if (!hasRoomOwner) {
				return false;
			}
		}

		const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LIST_CONTENT);
		if (hasRoomPermission) {
			return true;
		}

		const hasUsersFromAdminSchool =
			hasAdminPermission && roomMembershipAuthorizable.members.some((member) => member.userSchoolId === user.school.id);
		if (hasUsersFromAdminSchool) {
			return true;
		}

		const isRoomFromAdminSchool = hasAdminPermission && roomMembershipAuthorizable.schoolId === user.school.id;
		if (isRoomFromAdminSchool) {
			return true;
		}

		return false;
	}

	public canUpdateRoom(user: User, roomMembershipAuthorizable: RoomMembershipAuthorizable): boolean {
		const { roomPermissions } = this.resolveUserPermissions(user, roomMembershipAuthorizable);

		const result = roomPermissions.includes(Permission.ROOM_EDIT_ROOM);

		return result;
	}

	public canDeleteRoom(user: User, roomMembershipAuthorizable: RoomMembershipAuthorizable): boolean {
		const { schoolPermissions, roomPermissions } = this.resolveUserPermissions(user, roomMembershipAuthorizable);
		const hasRoomPermission = roomPermissions.includes(Permission.ROOM_DELETE_ROOM);
		const isOwnSchool = roomMembershipAuthorizable.schoolId === user.school.id;
		const canAdministrateSchoolRooms = schoolPermissions.includes(Permission.SCHOOL_ADMINISTRATE_ROOMS);

		const result = hasRoomPermission || (isOwnSchool && canAdministrateSchoolRooms);

		return result;
	}

	public canGetRoomMembers(user: User, roomMembershipAuthorizable: RoomMembershipAuthorizable): boolean {
		const { schoolPermissions, roomPermissions } = this.resolveUserPermissions(user, roomMembershipAuthorizable);
		const hasSchoolPermission = schoolPermissions.includes(Permission.SCHOOL_LIST_ROOM_MEMBERS);
		const hasRoomPermission = roomPermissions.includes(Permission.ROOM_LIST_CONTENT);

		const result = hasSchoolPermission && hasRoomPermission;

		return result;
	}

	private hasAccessToSchool(user: User, schoolId: string): boolean {
		const primarySchoolId = user.school.id;
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);

		const allSchools = [primarySchoolId, ...secondarySchoolIds];
		const includesSchool = allSchools.includes(schoolId);

		return includesSchool;
	}

	private hasRequiredRoomPermissions(roomPermissionsOfUser: Permission[], requiredPermissions: Permission[]): boolean {
		const missingPermissions = requiredPermissions.filter((permission) => !roomPermissionsOfUser.includes(permission));
		return missingPermissions.length === 0;
	}

	private resolveUserPermissions(
		user: User,
		object: RoomMembershipAuthorizable
	): { schoolPermissions: Permission[]; roomPermissions: Permission[]; allPermissions: Permission[] } {
		const schoolPermissions = this.resolveSchoolPermissions(user);
		const roomPermissions = this.resolveRoomPermissions(user, object);
		const allPermissions = [...schoolPermissions, ...roomPermissions];
		return {
			schoolPermissions,
			roomPermissions,
			allPermissions,
		};
	}

	private resolveSchoolPermissions(user: User): Permission[] {
		return [...user.roles].flatMap((role) => role.permissions ?? []);
	}

	private resolveRoomPermissions(user: User, object: RoomMembershipAuthorizable): Permission[] {
		return object.members
			.filter((member) => member.userId === user.id)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);
	}
}
