import { RoleName } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import { Role, RoleProperties } from '../repo';

export const roleFactory = BaseFactory.define<Role, RoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
