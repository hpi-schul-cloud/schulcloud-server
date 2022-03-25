import { RoleName } from '@shared/domain';
import { FilterRoleType, UserRole } from '../controller/dto';

export class RoleNameMapper {
	static mapToResponse(roleName: RoleName): UserRole {
		if (roleName === RoleName.ADMIN) return UserRole.ADMIN;
		if (roleName === RoleName.TEACHER) return UserRole.TEACHER;
		if (roleName === RoleName.STUDENT) return UserRole.STUDENT;
		throw Error('invalid role name from domain');
	}

	static mapToDomain(roleName: FilterRoleType): RoleName {
		if (roleName === FilterRoleType.ADMIN) return RoleName.ADMIN;
		if (roleName === FilterRoleType.TEACHER) return RoleName.TEACHER;
		if (roleName === FilterRoleType.STUDENT) return RoleName.STUDENT;
		throw Error('invalid role name from query');
	}
}
