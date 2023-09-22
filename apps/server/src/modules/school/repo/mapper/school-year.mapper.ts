import { SchoolYearEntity } from '@shared/domain';
import { SchoolYear } from '../../domain/do';

export class SchoolYearMapper {
	public static mapToDo(entity: SchoolYearEntity) {
		const schoolYear = new SchoolYear({
			id: entity.id,
			name: entity.name,
			startDate: entity.startDate,
			endDate: entity.endDate,
		});

		return schoolYear;
	}
}
