import { EntityDTO } from '@mikro-orm/core';
import { Course, Role, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';

export class RoleNameMapper {
	private static isSuperHero(roles: EntityDTO<Role>[]): boolean {
		return roles.some((role) => role.name === RoleName.SUPERHERO);
	}

	private static isAdministrator(roles: EntityDTO<Role>[], user: User, course: Course): boolean {
		const belongsToSameSchool = user.school.id === course.school.id;
		const isAdministrator = roles.some((role) => role.name === RoleName.ADMINISTRATOR);
		return belongsToSameSchool && isAdministrator;
	}

	private static isTeacher(user: User, course: Course): boolean {
		return course.getTeacherIds().includes(user.id);
	}

	private static isSubstitutionTeacher(user: User, course: Course): boolean {
		return course.getSubstitutionTeacherIds().includes(user.id);
	}

	private static isStudent(user: User, course: Course): boolean {
		return course.getStudentIds().includes(user.id);
	}

	static mapToRoleName(user: User, course: Course): RoleName {
		if (RoleNameMapper.isSuperHero(user.roles.toArray())) return RoleName.SUPERHERO;
		if (RoleNameMapper.isAdministrator(user.roles.toArray(), user, course)) return RoleName.ADMINISTRATOR;
		if (RoleNameMapper.isTeacher(user, course)) return RoleName.TEACHER;
		if (RoleNameMapper.isSubstitutionTeacher(user, course)) return RoleName.COURSESUBSTITUTIONTEACHER;
		if (RoleNameMapper.isStudent(user, course)) return RoleName.STUDENT;

		throw new Error('Role not found');
	}
}
