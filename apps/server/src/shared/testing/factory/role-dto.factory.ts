import { RoleName } from '@shared/domain/interface/rolename.enum';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { ObjectId } from 'bson';
import { userPermissions } from '../user-role-permissions';
import { BaseFactory } from './base.factory';

export const roleDtoFactory = BaseFactory.define<RoleDto, RoleDto>(RoleDto, () => {
	return {
		id: new ObjectId().toHexString(),
		name: RoleName.USER,
		permissions: userPermissions,
	};
});
