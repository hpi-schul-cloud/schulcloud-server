import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { Class } from '@src/modules/class/domain/class.do';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { Group } from '../../domain/group';
import { ClassInfoDto } from '../dto/class-info.dto';
import { ClassRootType } from '../dto/class-root-type';
import { ResolvedGroupUser } from '../dto/resolved-group-user';

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
			teachers: resolvedUsers
				.filter((groupUser: ResolvedGroupUser) => groupUser.role.name === RoleName.TEACHER)
				.map((groupUser: ResolvedGroupUser) => groupUser.user.lastName),
		});

		return mapped;
	}

	public static mapClassToClassInfoDto(clazz: Class, teachers: UserDO[], schoolYear?: SchoolYearEntity): ClassInfoDto {
		const name = clazz.gradeLevel ? `${clazz.gradeLevel}${clazz.name}` : clazz.name;

		const mapped: ClassInfoDto = new ClassInfoDto({
			id: clazz.id,
			type: ClassRootType.CLASS,
			name,
			externalSourceName: clazz.source,
			teachers: teachers.map((user: UserDO) => user.lastName),
			schoolYear: schoolYear?.name,
		});

		return mapped;
	}
}
