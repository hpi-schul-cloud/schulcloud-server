import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { BaseDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { AuthorizationContext } from './authorization-context.interface';

export interface Rule<T extends AuthorizableObject | BaseDO = AuthorizableObject | BaseDO> {
	isApplicable(user: User, object: unknown, context?: AuthorizationContext): boolean;
	hasPermission(user: User, object: T, context: AuthorizationContext): boolean;
}
