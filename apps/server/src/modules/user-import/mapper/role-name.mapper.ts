import { IImportUserRoleName } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { FilterRoleType, UserRole } from '../controller/dto';

export class RoleNameMapper {
	static mapToResponse(roleName: IImportUserRoleName): UserRole {
		if (roleName === RoleName.ADMINISTRATOR) return UserRole.ADMIN;
		if (roleName === RoleName.TEACHER) return UserRole.TEACHER;
		if (roleName === RoleName.STUDENT) return UserRole.STUDENT;
		throw Error('invalid role name from domain');
	}

	static mapToDomain(roleName: FilterRoleType): IImportUserRoleName {
		if (roleName === FilterRoleType.ADMIN) return RoleName.ADMINISTRATOR;
		if (roleName === FilterRoleType.TEACHER) return RoleName.TEACHER;
		if (roleName === FilterRoleType.STUDENT) return RoleName.STUDENT;
		throw Error('invalid role name from query');
	}
}
