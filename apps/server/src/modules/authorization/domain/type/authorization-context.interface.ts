import type { Permission } from '@shared/domain/interface/permission.enum';
import type { Action } from './action.enum';

export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}
