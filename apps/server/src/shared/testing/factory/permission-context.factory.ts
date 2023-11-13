/* istanbul ignore file */
import { ObjectId } from 'bson';
import { PermissionContextEntity, IPermissionContextProperties, Role } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

class PermissionContextFactory extends BaseFactory<PermissionContextEntity, IPermissionContextProperties> {
	withRole(role: Role): this {
		const params: DeepPartial<IPermissionContextProperties> = { role };

		return this.params(params);
	}

	withParentContext(parentContext: PermissionContextEntity): this {
		const params: DeepPartial<IPermissionContextProperties> = { parent_context: parentContext };

		return this.params(params);
	}

	withContextReference(contextReference: ObjectId): this {
		const params: DeepPartial<IPermissionContextProperties> = { contextReference };

		return this.params(params);
	}
}

export const permissionContextFactory = PermissionContextFactory.define(PermissionContextEntity, () => {
	return {
		include_permissions: [],
		exclude_permissions: [],
		parent_context: null,
		role: null,
		contextReference: new ObjectId(),
	};
});
