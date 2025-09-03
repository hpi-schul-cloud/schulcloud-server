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
import { RoomMembershipRule } from './room-membership.rule';
import { RoomMember } from '../do/room-member.do';

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
		const { requiredPermissions } = context;
		const hasPermissions = requiredPermissions.every((permission) =>
			this.hasRequiredPermission(user, object, permission)
		);

		return hasPermissions;
	}

	private hasRequiredPermission(user: User, object: RoomMemberAuthorizable, permission: Permission): boolean {
		const hasPermission = this.hasDynamicPermission(user, object, permission);
		const isImmutableUser = this.isImmutableMember(user, object.member);

		return hasPermission && !isImmutableUser;
	}

	private hasDynamicPermission(user: User, object: RoomMemberAuthorizable, permission: Permission): boolean {
		const hasPermission = this.roomMembershipRule.hasPermission(user, object.roomMembershipAuthorizable, {
			action: Action.write,
			requiredPermissions: [permission],
		});
		const isAdminOfUserSchool = this.isAdminOfUserSchool(user, object);

		return hasPermission || isAdminOfUserSchool;
	}

	private isAdminOfUserSchool(user: User, object: RoomMemberAuthorizable): boolean {
		const canAdministrateSchoolRooms = this.authorizationHelper.hasOneOfPermissions(user, [
			Permission.SCHOOL_ADMINISTRATE_ROOMS,
		]);
		const isSameSchool = object.member.schoolId === user.school.id;

		return canAdministrateSchoolRooms && isSameSchool;
	}

	// check is needed for removeMember - but needs to be reevaluated for other actions
	private isImmutableMember(user: User, member: RoomMember): boolean {
		const isRoomOwner = member.roomRoleName == RoleName.ROOMOWNER;
		const isCurrentUser = member.userId == user.id;

		return isRoomOwner || isCurrentUser;
	}
}
