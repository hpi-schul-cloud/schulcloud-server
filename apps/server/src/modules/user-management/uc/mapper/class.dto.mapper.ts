import { Class } from '../../domain/class';
import { ClassDto } from '../dto/class.dto';

export class ClassDtoMapper {
	public static mapToDto(c: Class): ClassDto {
		const classProps = c.getProps();

		const dto = new ClassDto({
			id: classProps.id,
			name: classProps.name,
		});

		return dto;
	}

	public static mapToDtos(classes: Class[]): ClassDto[] {
		const dtos = classes.map((c) => ClassDtoMapper.mapToDto(c));

		return dtos;
	}
}
