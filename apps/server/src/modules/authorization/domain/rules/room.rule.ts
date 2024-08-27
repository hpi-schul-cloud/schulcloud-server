import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Room } from '@src/modules/room';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class RoomRule implements Rule<Room> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof Room;

		return isMatched;
	}

	public hasPermission(user: User, object: Room, context: AuthorizationContext): boolean {
		const hasPermission = !!this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		return hasPermission;
	}
}
