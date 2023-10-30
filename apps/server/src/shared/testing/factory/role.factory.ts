import { IRoleProperties, Role } from '@shared/domain/entity/role.entity';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { BaseFactory } from './base.factory';

export const roleFactory = BaseFactory.define<Role, IRoleProperties>(Role, ({ sequence }) => {
	return {
		name: `role${sequence}` as unknown as RoleName,
	};
});
