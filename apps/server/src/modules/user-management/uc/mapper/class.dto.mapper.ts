import { Class } from '@src/modules/class/domain';
import { ClassForUserListDto } from '../dto/class-for-user-list.dto';

export class ClassDtoMapper {
	public static mapToDto(c: Class): ClassForUserListDto {
		const classProps = c.getProps();

		const dto = new ClassForUserListDto({
			id: classProps.id,
			name: classProps.name,
		});

		return dto;
	}

	public static mapToDtos(classes: Class[]): ClassForUserListDto[] {
		const dtos = classes.map((c) => ClassDtoMapper.mapToDto(c));

		return dtos;
	}
}
