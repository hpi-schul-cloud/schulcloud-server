import type { BaseEntity, User } from '../entity';
import { BaseDomainObject } from './domain-object';
import { IPermissionContext } from './permission';

export interface IPermission<T = BaseEntity | BaseDomainObject> {
	hasPermission(user: User, entity: T, context: IPermissionContext): boolean;
}
