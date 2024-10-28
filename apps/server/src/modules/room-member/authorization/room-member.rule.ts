import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AuthorizationInjectionService, Action, AuthorizationContext, Rule } from '@src/modules/authorization';
import { RoomMemberAuthorizable } from '../do/room-member-authorizable.do';

@Injectable()
export class RoomMemberRule implements Rule<RoomMemberAuthorizable> {
	constructor(private readonly authorisationInjectionService: AuthorizationInjectionService) {
		this.authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof RoomMemberAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomMemberAuthorizable, context: AuthorizationContext): boolean {
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
