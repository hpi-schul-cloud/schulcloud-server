import { Role, IRoleProperties } from '../entity/role.entity';
import { BaseFactory } from './base.factory';

export const roleFactory = BaseFactory.define<Role, IRoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role #${sequence}`,
	};
});
