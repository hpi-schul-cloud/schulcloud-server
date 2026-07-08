import { BaseFactory } from '@testing/factory/base.factory';
import { type RoleName } from '../domain';
import { Role, type RoleProperties } from '../repo';

export const roleFactory = BaseFactory.define<Role, RoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
