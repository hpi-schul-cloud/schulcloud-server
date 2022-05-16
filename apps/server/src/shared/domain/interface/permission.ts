import { Actions } from '@shared/domain/rules/actions.enum';

export interface IPermissionContext {
	action?: Actions;
	requiredPermissions: string[];
}
