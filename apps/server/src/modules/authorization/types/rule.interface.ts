import { AuthorizableObject, BaseDO, User } from '@shared/domain';
import { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T = AuthorizableObject | BaseDO> {
	isApplicable(user: User, object: T, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
