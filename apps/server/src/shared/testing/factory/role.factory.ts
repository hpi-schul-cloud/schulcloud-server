import { IRoleProperties, Role, RoleName } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';

class RoleFactory extends BaseEntityTestFactory<Role, IRoleProperties> {}

export const roleFactory = RoleFactory.define(Role, ({ sequence }) => {
	return {
		name: `role #${sequence}` as unknown as RoleName,
	};
});
