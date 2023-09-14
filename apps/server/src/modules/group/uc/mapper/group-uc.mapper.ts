import { RoleName, UserDO } from '@shared/domain';
import { Class } from '@src/modules/class/domain';
import { SystemDto } from '@src/modules/system';
import { Group } from '../../domain';
import { ClassInfoDto, ResolvedGroupUser } from '../dto';

export class GroupUcMapper {
	public static mapGroupToClassInfoDto(
		group: Group,
		resolvedUsers: ResolvedGroupUser[],
		system?: SystemDto
	): ClassInfoDto {
		const mapped: ClassInfoDto = new ClassInfoDto({
			name: group.name,
			externalSourceName: system?.displayName,
			teachers: resolvedUsers
				.filter((groupUser: ResolvedGroupUser) => groupUser.role.name === RoleName.TEACHER)
				.map((groupUser: ResolvedGroupUser) => groupUser.user.lastName),
		});

		return mapped;
	}

	public static mapClassToClassInfoDto(clazz: Class, teachers: UserDO[]): ClassInfoDto {
		const mapped: ClassInfoDto = new ClassInfoDto({
			name: clazz.name,
			externalSourceName: clazz.source,
			teachers: teachers.map((user: UserDO) => user.lastName),
		});

		return mapped;
	}
}
