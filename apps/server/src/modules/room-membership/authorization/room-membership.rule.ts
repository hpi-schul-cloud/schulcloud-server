import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AuthorizationInjectionService, Action, AuthorizationContext, Rule } from '@modules/authorization';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';

@Injectable()
export class RoomMembershipRule implements Rule<RoomMembershipAuthorizable> {
	constructor(private readonly authorisationInjectionService: AuthorizationInjectionService) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof RoomMembershipAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomMembershipAuthorizable, context: AuthorizationContext): boolean {
		const { action } = context;
		const permissionsThisUserHas = object.members
			.filter((member) => member.userId === user.id)
			.flatMap((member) => member.roles)
			.flatMap((role) => role.permissions ?? []);

		if (action === Action.read) {
			return permissionsThisUserHas.includes(Permission.ROOM_VIEW);
		}
		return permissionsThisUserHas.includes(Permission.ROOM_EDIT);
	}
}
