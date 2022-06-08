import type { User } from '../entity';
import { IEntity } from './entity';
import { IPermissionContext } from './permission';

export interface PermissionPublisher {
	checkCondition(user?: User, entity?: IEntity, context?: IPermissionContext): boolean;

	hasPermission(user: User, entity: IEntity, context: IPermissionContext): boolean;
}

export interface PermissionConsumer {
	permissionLayers: PermissionPublisher[];

	resolveLayer(user: User, entity: IEntity, context?: IPermissionContext): PermissionPublisher;
}

export interface PermissionAdapter extends PermissionPublisher, PermissionConsumer {}
