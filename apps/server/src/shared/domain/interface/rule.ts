import { Actions } from '@shared/domain/rules/actions.enum';
import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './base-domain-object';
import { Permission } from './permission.enum';

export interface IAuthorizationContext {
	action: Actions;
	requiredPermissions: Permission[];
}

export type AuthorizableObject = BaseDomainObject | BaseEntity;

// TODO: Why not IRule<T extends AuthorizableObject>?
export interface IRule<T = AuthorizableObject> {
	hasPermission(user: User, object: T, context: IAuthorizationContext): boolean;
}
