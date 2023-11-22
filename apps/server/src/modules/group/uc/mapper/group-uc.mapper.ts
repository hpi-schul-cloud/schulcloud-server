import { Class } from '@modules/class/domain';
import { SystemDto } from '@modules/system';
import { RoleName, SchoolYearEntity } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject';
import { Group } from '../../domain';
import { ClassInfoDto, ResolvedGroupDto, ResolvedGroupUser } from '../dto';
import { ClassRootType } from '../dto/class-root-type';

export class GroupUcMapper {
	public static mapGroupToClassInfoDto(
		group: Group,
		resolvedUsers: ResolvedGroupUser[],
		system?: SystemDto
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
		});

		return mapped;
	}
}
