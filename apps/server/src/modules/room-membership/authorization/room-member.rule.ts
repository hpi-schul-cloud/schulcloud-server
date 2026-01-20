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
			this.hasDynamicPermission(user, object, permission)
		);

		return hasPermissions;
	}

	private hasDynamicPermission(user: User, object: RoomMemberAuthorizable, permission: Permission): boolean {
		const isAlreadyRoomOwner = object.member.roomRoleName === RoleName.ROOMOWNER;
		if (isAlreadyRoomOwner) {
			return false;
		}

		const isAdminOfUserSchool = this.isAdminOfUserSchool(user, object);
		if (isAdminOfUserSchool) {
			return true;
		}

		const hasPermission = this.roomMembershipRule.hasPermission(user, object.roomMembershipAuthorizable, {
			action: Action.write,
			requiredPermissions: [permission],
		});
		const isCurrentUser = object.member.userId === user.id;

		return hasPermission && !isCurrentUser;
	}

	private isAdminOfUserSchool(user: User, object: RoomMemberAuthorizable): boolean {
		const canAdministrateSchoolRooms = this.authorizationHelper.hasOneOfPermissions(user, [
			Permission.SCHOOL_ADMINISTRATE_ROOMS,
		]);
		const isSameSchool = object.member.schoolId === user.school.id;

		return canAdministrateSchoolRooms && isSameSchool;
	}
}
