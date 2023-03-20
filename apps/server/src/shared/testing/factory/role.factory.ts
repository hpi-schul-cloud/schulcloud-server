import { IRoleProperties, Role, RoleName } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const roleFactory = BaseFactory.define<Role, IRoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
