/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { PermissionContextEntity, IPermissionContextProperties, UserDelta, EntityId } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

class PermissionContextFactory extends BaseFactory<PermissionContextEntity, IPermissionContextProperties> {
	withUserDelta(userDelta: IPermissionContextProperties['userDelta']): this {
		const params: DeepPartial<IPermissionContextProperties> = { userDelta };

		return this.params(params);
	}

	withParentContext(parentContext: PermissionContextEntity): this {
		const params: DeepPartial<IPermissionContextProperties> = { parentContext };

		return this.params(params);
	}

	withContextReference(contextReference: EntityId): this {
		const params: DeepPartial<IPermissionContextProperties> = { contextReference };

		return this.params(params);
	}
}

export const permissionContextFactory = PermissionContextFactory.define(PermissionContextEntity, () => {
	return {
		userDelta: new UserDelta([]),
		parentContext: null,
		contextReference: new ObjectId(),
	};
});
