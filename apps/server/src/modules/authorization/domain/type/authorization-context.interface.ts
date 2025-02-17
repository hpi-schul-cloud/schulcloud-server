import type { Permission } from '@shared/domain/interface';
import type { Action } from './action.enum';

export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}
