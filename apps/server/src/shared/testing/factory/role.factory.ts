import { Role, RoleProperties } from '@shared/domain';
import { RoleName } from '@shared/domain/interface';
import { BaseFactory } from './base.factory';

export const roleFactory = BaseFactory.define<Role, RoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
