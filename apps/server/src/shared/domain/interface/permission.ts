import { Actions } from '@shared/domain/rules/actions.enum';
import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './base-domain-object';
import { Permission } from './permission.enum';
import { BaseDO } from '../domainobject';

export interface AuthorizationContext {
	action: Actions;
	requiredPermissions: Permission[];
}

export type PermissionTypes = BaseDomainObject | BaseEntity | BaseDO;

export interface IPermission<T = PermissionTypes> {
	hasPermission(user: User, entity: T, context: AuthorizationContext): boolean;
}
