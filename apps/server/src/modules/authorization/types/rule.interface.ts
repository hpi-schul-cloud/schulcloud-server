import { AuthorizableObject, User } from '@shared/domain';
import { LegacyAuthorizableObject } from './authorizable-object.type';
import { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T = AuthorizableObject | LegacyAuthorizableObject> {
	isApplicable(user: User, object: T, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
