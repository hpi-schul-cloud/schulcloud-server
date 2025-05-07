import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { userPermissions } from '@testing/user-role-permissions';
import { RoleName } from '../domain';
import { RoleDto } from '../service';

export const roleDtoFactory = BaseFactory.define<RoleDto, RoleDto>(RoleDto, () => {
	return {
		id: new ObjectId().toHexString(),
		name: RoleName.USER,
		permissions: userPermissions,
	};
});
