import type { User } from '../entity';
import { IEntity } from './entity';
import { IPermissionContext } from './permission';

export interface PermissionLayer {
	checkCondition(user?: User, entity?: IEntity, context?: IPermissionContext): boolean;

	hasPermission(user: User, entity: IEntity, context: IPermissionContext): boolean;
}

export interface PermissionLayerResolver {
	permissionLayers: PermissionLayer[];

	resolveLayer(user: User, entity: IEntity, context?: IPermissionContext): PermissionLayer;
}
