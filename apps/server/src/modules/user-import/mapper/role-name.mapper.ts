import { RoleName } from '@shared/domain';
import { RoleNameFilterQuery, RoleNameResponse } from '../controller/dto';

export class RoleNameMapper {
	static mapToResponse(roleName: RoleName): RoleNameResponse {
		if (roleName === RoleName.ADMIN) return RoleNameResponse.ADMIN;
		if (roleName === RoleName.TEACHER) return RoleNameResponse.TEACHER;
		if (roleName === RoleName.STUDENT) return RoleNameResponse.STUDENT;
		throw Error(); // ToDo: right error
	}

	static mapToDomain(roleName: RoleNameFilterQuery): RoleName {
		if (roleName === RoleNameFilterQuery.ADMIN) return RoleName.ADMIN;
		if (roleName === RoleNameFilterQuery.TEACHER) return RoleName.TEACHER;
		if (roleName === RoleNameFilterQuery.STUDENT) return RoleName.STUDENT;
		throw Error(); // ToDo: right error
	}
}
