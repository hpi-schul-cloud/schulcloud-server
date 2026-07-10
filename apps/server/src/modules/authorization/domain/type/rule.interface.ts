import type { User } from '@modules/user/repo';
import { type AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { type BaseDO } from '@shared/domain/domainobject';
import { type AuthorizationContext } from './authorization-context.interface';

export interface Rule<T extends AuthorizableObject | BaseDO = AuthorizableObject | BaseDO> {
	isApplicable(user: User, object: unknown, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
