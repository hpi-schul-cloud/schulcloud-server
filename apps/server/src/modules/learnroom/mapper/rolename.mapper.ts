import { EntityDTO } from '@mikro-orm/core';
import { CourseEntity } from '@modules/course/repo';
import { UnprocessableEntityException } from '@nestjs/common';
import { Role, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';

export class RoleNameMapper {
	private static isSuperHero(roles: EntityDTO<Role>[]): boolean {
		return roles.some((role) => role.name === RoleName.SUPERHERO);
	}

	private static isAdministrator(roles: EntityDTO<Role>[], user: User, course: CourseEntity): boolean {
		const belongsToSameSchool = user.school.id === course.school.id;
		const isAdministrator = roles.some((role) => role.name === RoleName.ADMINISTRATOR);
		return belongsToSameSchool && isAdministrator;
	}

	private static isTeacher(user: User, course: CourseEntity): boolean {
		return course.getTeacherIds().includes(user.id);
	}

	private static isSubstitutionTeacher(user: User, course: CourseEntity): boolean {
		return course.getSubstitutionTeacherIds().includes(user.id);
	}

	private static isStudent(user: User, course: CourseEntity): boolean {
		return course.getStudentIds().includes(user.id);
	}

	static mapToRoleName(user: User, course: CourseEntity): RoleName {
		if (RoleNameMapper.isSuperHero(user.roles.toArray())) return RoleName.SUPERHERO;
		if (RoleNameMapper.isAdministrator(user.roles.toArray(), user, course)) return RoleName.ADMINISTRATOR;
		if (RoleNameMapper.isTeacher(user, course)) return RoleName.TEACHER;
		if (RoleNameMapper.isSubstitutionTeacher(user, course)) return RoleName.COURSESUBSTITUTIONTEACHER;
		if (RoleNameMapper.isStudent(user, course)) return RoleName.STUDENT;

		throw new UnprocessableEntityException(
			`Unable to determine a valid role for user ${user.id} in course ${course.id}`
		);
	}
}
