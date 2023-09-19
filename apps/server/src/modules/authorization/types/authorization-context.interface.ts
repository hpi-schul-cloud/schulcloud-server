import { Permission } from '@shared/domain';
import { Action } from './action.enum';

// need to move to shared
export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}
