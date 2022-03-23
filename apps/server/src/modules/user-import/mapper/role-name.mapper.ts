import { RoleName } from '@shared/domain';
import { RoleNameFilterParams, RoleNameResponse } from '../controller/dto';

export class RoleNameMapper {
	static mapToResponse(roleName: RoleName): RoleNameResponse {
		if (roleName === RoleName.ADMIN) return RoleNameResponse.ADMIN;
		if (roleName === RoleName.TEACHER) return RoleNameResponse.TEACHER;
		if (roleName === RoleName.STUDENT) return RoleNameResponse.STUDENT;
		throw Error('invalid role name from domain');
	}

	static mapToDomain(roleName: RoleNameFilterParams): RoleName {
		if (roleName === RoleNameFilterParams.ADMIN) return RoleName.ADMIN;
		if (roleName === RoleNameFilterParams.TEACHER) return RoleName.TEACHER;
		if (roleName === RoleNameFilterParams.STUDENT) return RoleName.STUDENT;
		throw Error('invalid role name from query');
	}
}
