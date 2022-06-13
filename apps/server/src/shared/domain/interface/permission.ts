import { Actions } from '@shared/domain/rules/actions.enum';
import { Permission } from './permission.enum';
import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './base-domain-object';

export interface IPermissionContext {
	action?: Actions;
	requiredPermissions: Permission[];
}

export type PermissionTypes = BaseDomainObject | BaseEntity;

export interface IPermission<T = PermissionTypes> {
	hasPermission(user: User, entity: T, context: IPermissionContext): boolean;
}
