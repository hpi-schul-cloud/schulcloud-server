import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { SchoolYear } from '../../../domain';

export class SchoolYearEntityMapper {
	public static mapToDo(entity: SchoolYearEntity) {
		const schoolYear = new SchoolYear({
			id: entity.id,
			name: entity.name,
			startDate: entity.startDate,
			endDate: entity.endDate,
		});

		return schoolYear;
	}

	public static mapToDos(entities: SchoolYearEntity[]) {
		const schoolYears = entities.map((entity) => this.mapToDo(entity));

		return schoolYears;
	}
}
