import { Class } from '@modules/class/domain';
import { Course } from '@modules/course';
import { RoleName } from '@modules/role';
import { SchoolYearEntity } from '@modules/school/repo';
import { System } from '@modules/system';
import { UserDo } from '@modules/user';
import { Group } from '../../domain';
import { ClassInfoDto, ClassRootType, CourseInfoDto, ResolvedGroupDto, ResolvedGroupUser } from '../dto';

export class GroupUcMapper {
	public static mapGroupToClassInfoDto(
		group: Group,
		resolvedGroupUsers: ResolvedGroupUser[],
		synchronizedCourses: Course[],
		system?: System
	): ClassInfoDto {
		const students = GroupUcMapper.filterGroupUsersByRole(resolvedGroupUsers, RoleName.STUDENT);
		const teachers = GroupUcMapper.filterGroupUsersByRole(resolvedGroupUsers, RoleName.TEACHER);
		const teacherNames = GroupUcMapper.getLastNamesOfGroupUsers(teachers);
		const synchronizedCourseInfoDtos = GroupUcMapper.mapCourseToCourseInfoDtos(synchronizedCourses);

		const classInfoDtos = new ClassInfoDto({
			id: group.id,
			type: ClassRootType.GROUP,
			name: group.name,
			externalSourceName: system?.displayName,
			teacherNames,
			studentCount: students.length,
			synchronizedCourses: synchronizedCourseInfoDtos, // Naming of key synchronizedCourses is wrong, this are only infos not the course it self.
		});

		return classInfoDtos;
	}

	private static mapCourseToCourseInfoDtos(courses: Course[]): CourseInfoDto[] {
		const courseInfoDtos = courses.map(
			(course: Course): CourseInfoDto =>
				new CourseInfoDto({
					id: course.id,
					name: course.name,
				})
		);

		return courseInfoDtos;
	}

	private static getLastNamesOfGroupUsers(groupUsers: ResolvedGroupUser[]): string[] {
		const lastNames = groupUsers.map((groupUser: ResolvedGroupUser) => groupUser.user.lastName);

		return lastNames;
	}

	private static getLastNamesOfUsers(users: UserDo[]): string[] {
		const lastNames = users.map((user: UserDo) => user.lastName);

		return lastNames;
	}

	private static filterGroupUsersByRole(groupUsers: ResolvedGroupUser[], role: RoleName): ResolvedGroupUser[] {
		const filteredGroupUsers = groupUsers.filter((groupUser: ResolvedGroupUser) => groupUser.role.name === role);

		return filteredGroupUsers;
	}

	public static mapClassToClassInfoDto(clazz: Class, teachers: UserDo[], schoolYear?: SchoolYearEntity): ClassInfoDto {
		const name = clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name;
		const isUpgradable = clazz.gradeLevel !== 13 && !clazz.successor;
		const teacherNames = GroupUcMapper.getLastNamesOfUsers(teachers);

		const mapped = new ClassInfoDto({
			id: clazz.id,
			type: ClassRootType.CLASS,
			name,
			externalSourceName: clazz.source,
			teacherNames,
			schoolYear: schoolYear?.name,
			isUpgradable,
			studentCount: clazz.userIds ? clazz.userIds.length : 0,
		});

		return mapped;
	}

	public static mapToResolvedGroupDto(group: Group, resolvedGroupUsers: ResolvedGroupUser[]): ResolvedGroupDto {
		const mapped: ResolvedGroupDto = new ResolvedGroupDto({
			id: group.id,
			name: group.name,
			type: group.type,
			externalSource: group.externalSource,
			users: resolvedGroupUsers,
			organizationId: group.organizationId,
			validPeriod: group.validPeriod,
		});

		return mapped;
	}
}
