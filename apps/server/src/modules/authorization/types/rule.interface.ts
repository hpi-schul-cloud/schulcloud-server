import { User } from '@shared/domain';
import { AuthorizableObject } from './authorizable-object.type';
import { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T = AuthorizableObject> {
	isApplicable(user: User, object: T, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
