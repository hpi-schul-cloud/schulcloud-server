import { SchoolYear } from '../../domain';
import { SchoolYearEntity } from '../school-year.entity';

export class SchoolYearEntityMapper {
	public static mapToDo(entity: SchoolYearEntity): SchoolYear {
		const schoolYear = new SchoolYear({
			id: entity.id,
			name: entity.name,
			startDate: entity.startDate,
			endDate: entity.endDate,
			courseCreationInNextYear: entity.courseCreationInNextYear,
		});

		return schoolYear;
	}

	public static mapToDos(entities: SchoolYearEntity[]): SchoolYear[] {
		const schoolYears = entities.map((entity) => SchoolYearEntityMapper.mapToDo(entity));

		return schoolYears;
	}
}
