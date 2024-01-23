import { Permission } from '@shared/domain/interface';
import { Action } from './action.enum';

export interface AuthorizationContext {
	action: Action;
	requiredPermissions: Permission[];
}
