import { RoleDto } from '@modules/role/service/dto/role.dto';
import { RoleName } from '@shared/domain/interface';
import { ObjectId } from '@mikro-orm/mongodb';
import { userPermissions } from '../user-role-permissions';
import { BaseFactory } from './base.factory';

export const roleDtoFactory = BaseFactory.define<RoleDto, RoleDto>(RoleDto, () => {
	return {
		id: new ObjectId().toHexString(),
		name: RoleName.USER,
		permissions: userPermissions,
	};
});
