import { Role, RoleName, RoleProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const roleFactory = BaseFactory.define<Role, RoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
