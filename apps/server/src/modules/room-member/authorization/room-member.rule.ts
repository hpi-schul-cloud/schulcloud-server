import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { RoomMemberEntity } from '@src/modules/room-member';
import { AuthorizationHelper } from '@src/modules/authorization/domain/service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '@src/modules/authorization/domain/type';
import { AuthorizationInjectionService } from '@src/modules/authorization/domain/service/authorization-injection.service';

@Injectable()
export class RoomMemberRule implements Rule<RoomMemberEntity> {
	constructor(
		// TODO: check if we can remove this
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof RoomMemberEntity;

		return isMatched;
	}

	public hasPermission(user: User, object: RoomMemberEntity, context: AuthorizationContext): boolean {
		const { action } = context;
		const userPermissionsForThisRoom = object.userGroup.users
			.filter((group) => group.user.id === user.id)
			.flatMap((group) => group.role.permissions);
		if (action === Action.read) {
			return userPermissionsForThisRoom.includes(Permission.ROOM_VIEW);
		}
		return userPermissionsForThisRoom.includes(Permission.ROOM_EDIT);
	}
}
