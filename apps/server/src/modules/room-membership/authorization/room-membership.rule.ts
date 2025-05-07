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
		if (!this.hasAccessToSchool(user, object.schoolId)) {
			return false;
		}

		if (!this.hasRequiredRoomPermissions(user, object, context.requiredPermissions)) {
			return false;
		}

		const { action } = context;
		const permissionsThisUserHas = object.members
			.filter((member) => member.userId === user.id)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		if (action === Action.read) {
			return permissionsThisUserHas.includes(Permission.ROOM_VIEW);
		}
		return permissionsThisUserHas.includes(Permission.ROOM_CONTENT_EDIT);
	}

	private hasAccessToSchool(user: User, schoolId: string): boolean {
		const primarySchoolId = user.school.id;
		const secondarySchools = user.secondarySchools ?? [];
		const secondarySchoolIds = secondarySchools.map(({ school }) => school.id);

		return [primarySchoolId, ...secondarySchoolIds].includes(schoolId);
	}

	private hasRequiredRoomPermissions(
		user: User,
		object: RoomMembershipAuthorizable,
		requiredPermissions: string[]
	): boolean {
		const roomPermissionsOfUser = this.resolveRoomPermissions(user, object);
		const missingPermissions = requiredPermissions.filter((permission) => !roomPermissionsOfUser.includes(permission));
		return missingPermissions.length === 0;
	}

	private resolveRoomPermissions(user: User, object: RoomMembershipAuthorizable): string[] {
		const member = object.members.find((m) => m.userId === user.id);
		if (!member) {
			return [];
		}
		return member.roles.flatMap((role) => role.permissions ?? []);
	}
}
