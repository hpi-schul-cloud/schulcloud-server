import { Actions } from '@shared/domain/rules/actions.enum';
import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './base-domain-object';
import { Permission } from './permission.enum';

export interface IAuthorizationContext {
	action: Actions;
	requiredPermissions: Permission[];
}

export type AuthorizableObjectType = BaseDomainObject | BaseEntity;

export interface IRule<T = AuthorizableObjectType> {
	hasPermission(user: User, object: T, context: IAuthorizationContext): boolean;
}
