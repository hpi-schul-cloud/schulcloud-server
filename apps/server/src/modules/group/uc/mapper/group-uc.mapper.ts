import { Class } from '@src/modules/class/domain';
import { SystemDto } from '@src/modules/system';
import { Group } from '../../domain';
import { ClassInfoDto } from '../dto/class-info.dto';

export class GroupUcMapper {
	public static mapGroupToClassInfoDto(group: Group, system?: SystemDto): ClassInfoDto {
		const mapped: ClassInfoDto = new ClassInfoDto({
			name: group.name,
			externalSourceName: system?.displayName,
			teachers: group.
		})
	}

	public static mapClassToClassInfoDto(clazz: Class): ClassInfoDto {
		const mapped: ClassInfoDto = new ClassInfoDto({
			name: clazz.name,
			externalSourceName: clazz.source,
			teachers: clazz.
		})
	}
}