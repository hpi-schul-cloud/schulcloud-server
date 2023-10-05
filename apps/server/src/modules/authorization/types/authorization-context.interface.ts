import { Permission } from '@shared/domain';
import { Action } from './action.enum';

export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}
