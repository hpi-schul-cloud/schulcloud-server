import { SchoolEntity } from '@shared/domain';
import { School } from '../../domain/do/school';
import { FederalStateMapper } from './federal-state.mapper';
import { SchoolYearMapper } from './school-year.mapper';

export class SchoolMapper {
	public static mapToDo(entity: SchoolEntity): School {
		const schoolYear = entity.schoolYear && SchoolYearMapper.mapToDo(entity.schoolYear);
		const federalState = FederalStateMapper.mapToDo(entity.federalState);

		const school = new School({
			id: entity.id,
			name: entity.name,
			officialSchoolNumber: entity.officialSchoolNumber,
			externalId: entity.externalId,
			previousExternalId: entity.previousExternalId,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			schoolYear,
			federalState,
			county: entity.county,
			purpose: entity.purpose,
			features: entity.features,
		});

		return school;
	}

	public static mapToDos(schoolEntities: SchoolEntity[]): School[] {
		const schools = schoolEntities.map((entity) => this.mapToDo(entity));

		return schools;
	}
}
