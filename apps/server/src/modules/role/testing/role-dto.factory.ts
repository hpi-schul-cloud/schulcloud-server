import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import { userPermissions } from '@testing/user-role-permissions';
import { RoleDto } from '../service';

export const roleDtoFactory = BaseFactory.define<RoleDto, RoleDto>(RoleDto, () => {
	return {
		id: new ObjectId().toHexString(),
		name: RoleName.USER,
		permissions: userPermissions,
	};
});
