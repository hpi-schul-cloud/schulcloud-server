import { RoleName } from '@shared/domain';
import { RoleNameResponse } from '../controller/dto';

export class RoleNameMapper {
	static mapToResponse(roleName: RoleName): RoleNameResponse {
		if (roleName === RoleName.ADMIN) return RoleNameResponse.ADMIN;
		if (roleName === RoleName.TEACHER) return RoleNameResponse.TEACHER;
		if (roleName === RoleName.STUDENT) return RoleNameResponse.STUDENT;
		throw Error(); // ToDo: right error
	}
}
