// fix import when it is avaible

import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject/base.do';
import { User } from '@shared/domain/entity/user.entity';
import { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T = AuthorizableObject | BaseDO> {
	isApplicable(user: User, object: T, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
