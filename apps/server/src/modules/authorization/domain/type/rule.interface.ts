import type { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import type { BaseDO } from '@shared/domain/domainobject/base.do';
import { User } from '@shared/domain/entity/user.entity';
import type { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T extends AuthorizableObject | BaseDO = AuthorizableObject | BaseDO> {
	isApplicable(user: User, object: unknown, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
