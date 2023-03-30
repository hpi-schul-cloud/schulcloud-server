import { Actions } from '@shared/domain/rules/actions.enum';
import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './base-domain-object';
import { Permission } from './permission.enum';
import { BaseDO } from '../domainobject';

export interface AuthorizationContext {
	action: Actions;
	requiredPermissions: Permission[];
}

export type AuthorizableObject = BaseDomainObject | BaseEntity | BaseDO;

export interface Rule<T = AuthorizableObject> {
	hasPermission(user: User, entity: T, context: AuthorizationContext): boolean;
}
