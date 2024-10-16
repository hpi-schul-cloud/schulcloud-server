import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AuthorizationInjectionService, Action, AuthorizationContext, Rule } from '@src/modules/authorization';
import { RoomAuthorizable } from '../domain/do/room-authorizable';

@Injectable()
export class RoomRule implements Rule<RoomAuthorizable> {
	constructor(private readonly authorisationInjectionService: AuthorizationInjectionService) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof RoomAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomAuthorizable, context: AuthorizationContext): boolean {
		const { action } = context;

		const allMembers = object.getProps().roomMembers.flatMap((item) => item.members);
		const permissionsThisUserHas = allMembers
			.filter((member) => member.userId.toHexString() === user.id)
			.flatMap((member) => member.role.permissions);

		if (action === Action.read) {
			return permissionsThisUserHas.includes(Permission.ROOM_VIEW);
		}
		return permissionsThisUserHas.includes(Permission.ROOM_EDIT);
	}
}
