import { IPermissionContext, User } from '@shared/domain';

export class ErrorUtils {
	public static createMessageForForbidden(user: User, context: IPermissionContext) {
		const message = `userId: ${user.id}, action: ${
			context.action
		}, requiredPermissions: ${context.requiredPermissions.join(',')}`;

		return message;
	}
}
