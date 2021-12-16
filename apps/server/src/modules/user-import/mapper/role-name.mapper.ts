
import { RoleName } from '@shared/domain';
import { RoleNameResponse } from '../controller/dto';

export class RoleNameMapper {
	static mapToResponse(roleName: RoleName): RoleNameResponse {
        if (roleName === RoleName.ADMIN) return RoleNameResponse.ADMIN;
        else if (roleName === RoleName.TEACHER) return RoleNameResponse.TEACHER;
        else if (roleName === RoleName.STUDENT) return RoleNameResponse.STUDENT;
        else throw Error(); // ToDo: right error
	}
}