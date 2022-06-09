import { Actions } from '@shared/domain/rules/actions.enum';
import { Permission } from './permission.enum';

export interface IPermissionContext {
	action?: Actions;
	requiredPermissions: Permission[];
}
