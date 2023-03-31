import { Action } from '@shared/domain/rules/action.enum';
import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './base-domain-object';
import { Permission } from './permission.enum';
import { BaseDO } from '../domainobject';

export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}

export type AuthorizableObject = BaseDomainObject | BaseEntity | BaseDO;

export interface Rule<T = AuthorizableObject> {
	isApplicable(user: User, object: T, context?: AuthorizationContext): boolean;
	hasPermission(user: User, entity: T, context: AuthorizationContext): boolean;
}
