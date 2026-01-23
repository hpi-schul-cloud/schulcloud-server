import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { RoleName } from '@modules/role';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { RoomMemberAuthorizable } from '../do/room-member-authorizable.do';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';
import { RoomMembershipRule } from './room-membership.rule';

@Injectable()
export class RoomMemberRule implements Rule<RoomMemberAuthorizable> {
	constructor(
		private readonly roomMembershipRule: RoomMembershipRule,
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly authorisationInjectionService: AuthorizationInjectionService
	) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(_: User, object: unknown): boolean {
		const isMatched = object instanceof RoomMemberAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomMemberAuthorizable, context: AuthorizationContext): boolean {
		if (!this.hasAccessToSchool(user, object.schoolId)) {
			return false;
		}
		const hasAllPermissions = this.hasAllPermissions(user, object, context.requiredPermissions ?? []);

		return hasAllPermissions;
	}

	private hasAllPermissions(user: User, object: RoomMemberAuthorizable, requiredPermissions: Permission[]): boolean {
		const { allPermissions } = this.resolveUserPermissions(user, object.roomMembershipAuthorizable);
		const missingPermissions = requiredPermissions.filter((permission) => !allPermissions.includes(permission));
		return missingPermissions.length === 0;
	}

	public canPassOwnershipTo(user: User, object: RoomMemberAuthorizable): boolean {
		const isAlreadyRoomOwner = object.member.roomRoleName === RoleName.ROOMOWNER;
		const isStudent = object.member.schoolRoleNames.includes(RoleName.STUDENT);
		const isExternalPerson = object.member.schoolRoleNames.includes(RoleName.EXTERNALPERSON);
		if (isAlreadyRoomOwner || isStudent || isExternalPerson) {
			return false;
		}

		const isAdminOfUserSchool = this.isAdminOfUserSchool(user, object);
		if (isAdminOfUserSchool) {
			return true;
		}

		const hasPermission = this.roomMembershipRule.hasPermission(user, object.roomMembershipAuthorizable, {
			action: Action.write,
			requiredPermissions: [Permission.ROOM_CHANGE_OWNER],
		});
		const isNotHimself = object.member.userId !== user.id;

		return hasPermission && isNotHimself;
	}

	public canRemoveMember(user: User, object: RoomMemberAuthorizable): boolean {
		const { roomPermissions } = this.resolveUserPermissions(user, object.roomMembershipAuthorizable);

		const isRemoveRoomOwner = object.member.roomRoleName === RoleName.ROOMOWNER;
		if (isRemoveRoomOwner) {
			return false;
		}

		const hasRoomPermission = roomPermissions.includes(Permission.ROOM_REMOVE_MEMBERS);
		const isHimself = object.member.userId === user.id;
		if (hasRoomPermission && !isHimself) {
			return true;
		}

		const isAdminOfUserSchool = this.isAdminOfUserSchool(user, object);
		if (isAdminOfUserSchool) {
			return true;
		}

		return false;
	}

	private isAdminOfUserSchool(user: User, object: RoomMemberAuthorizable): boolean {
		const canAdministrateSchoolRooms = this.authorizationHelper.hasOneOfPermissions(user, [
			Permission.SCHOOL_ADMINISTRATE_ROOMS,
		]);
		const isSameSchool = object.member.schoolId === user.school.id;

		return canAdministrateSchoolRooms && isSameSchool;
	}

	private hasAccessToSchool(user: User, schoolId: string): boolean {
		const primarySchoolId = user.school.id;
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);

		const allSchools = [primarySchoolId, ...secondarySchoolIds];
		const includesSchool = allSchools.includes(schoolId);

		return includesSchool;
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
