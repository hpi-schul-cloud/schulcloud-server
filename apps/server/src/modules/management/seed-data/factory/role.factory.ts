import { RoleName } from '@modules/role';
import { Role, RoleProperties } from '@modules/role/repo';
import { BaseFactory } from './base.factory';

export const roleFactory = BaseFactory.define<Role, RoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
