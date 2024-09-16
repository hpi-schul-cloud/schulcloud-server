import { Class } from '@modules/class/domain';
import { System } from '@modules/system';
import { UserDO } from '@shared/domain/domainobject';
import { SchoolYearEntity } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { Course } from '@src/modules/learnroom/domain';
import { Group } from '../../domain';
import { ClassInfoDto, CourseInfoDto, ResolvedGroupDto, ResolvedGroupUser } from '../dto';
import { ClassRootType } from '../dto/class-root-type';

export class GroupUcMapper {
	public static mapGroupToClassInfoDto(
		group: Group,
		resolvedUsers: ResolvedGroupUser[],
		synchronizedCourses: Course[],
		system?: System
	): ClassInfoDto {
		const mapped: ClassInfoDto = new ClassInfoDto({
			id: group.id,
			type: ClassRootType.GROUP,
			name: group.name,
			externalSourceName: system?.displayName,
			teacherNames: resolvedUsers
				.filter((groupUser: ResolvedGroupUser) => groupUser.role.name === RoleName.TEACHER)
				.map((groupUser: ResolvedGroupUser) => groupUser.user.lastName),
			studentCount: resolvedUsers.filter((groupUser: ResolvedGroupUser) => groupUser.role.name === RoleName.STUDENT)
				.length,
			synchronizedCourses: synchronizedCourses.map(
				(course: Course): CourseInfoDto =>
					new CourseInfoDto({
						id: course.id,
						name: course.name,
					})
			),
		});

		return mapped;
	}

	public static mapClassToClassInfoDto(clazz: Class, teachers: UserDO[], schoolYear?: SchoolYearEntity): ClassInfoDto {
		const name = clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name;
		const isUpgradable = clazz.gradeLevel !== 13 && !clazz.successor;

		const mapped: ClassInfoDto = new ClassInfoDto({
			id: clazz.id,
			type: ClassRootType.CLASS,
			name,
			externalSourceName: clazz.source,
			teacherNames: teachers.map((user: UserDO) => user.lastName),
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
