import { RoleName } from '@modules/role';
import { FilterRoleType, UserRole } from '../controller/dto';
import { ImportUserRoleName } from '../entity';

export class RoleNameMapper {
	static mapToResponse(roleName: ImportUserRoleName): UserRole {
		if (roleName === RoleName.ADMINISTRATOR) return UserRole.ADMIN;
		if (roleName === RoleName.TEACHER) return UserRole.TEACHER;
		if (roleName === RoleName.STUDENT) return UserRole.STUDENT;
		/* needed mapping for external persons here for import functionality to be consistent? */
		throw Error('invalid role name from domain');
	}

	static mapToDomain(roleName: FilterRoleType): ImportUserRoleName {
		if (roleName === FilterRoleType.ADMIN) return RoleName.ADMINISTRATOR;
		if (roleName === FilterRoleType.TEACHER) return RoleName.TEACHER;
		if (roleName === FilterRoleType.STUDENT) return RoleName.STUDENT;
		/* needed mapping for external persons here for import functionality to be consistent? */
		throw Error('invalid role name from query');
	}
}
