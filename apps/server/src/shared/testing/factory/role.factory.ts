import { IRoleProperties, Role, RoleName } from '@shared/domain';
import { BaseFactory } from './base.factory';

class RoleFactory extends BaseFactory<Role, IRoleProperties> {}

export const roleFactory = RoleFactory.define(Role, ({ sequence }) => {
	return {
		name: `role #${sequence}` as unknown as RoleName,
	};
});
