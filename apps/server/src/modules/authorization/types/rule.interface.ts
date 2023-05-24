import { BaseDO, User } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T = AuthorizableObject | BaseDO> {
	isApplicable(user: User, object: T, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
