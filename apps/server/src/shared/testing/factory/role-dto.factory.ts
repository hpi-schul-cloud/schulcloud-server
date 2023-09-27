import { RoleName } from '@shared/domain';
import { ObjectId } from 'bson';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { BaseFactory } from './base.factory';
import { userPermissions } from '../user-role-permissions';

export const roleDtoFactory = BaseFactory.define<RoleDto, RoleDto>(RoleDto, () => {
	return {
		id: new ObjectId().toHexString(),
		name: RoleName.USER,
		permissions: userPermissions,
	};
});
