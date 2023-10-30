import { Permission } from '@shared/domain/interface/permission.enum';
import { Action } from './action.enum';

export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}
