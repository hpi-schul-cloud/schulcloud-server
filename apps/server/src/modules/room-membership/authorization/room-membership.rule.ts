import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
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

	private resolveRoomPermissions(user: User, object: RoomMembershipAuthorizable): Permission[] {
		return object.members
			.filter((member) => member.userId === user.id)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);
	}
}
