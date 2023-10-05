import { SchoolEntity } from '@shared/domain';
import { School, SchoolFeature } from '../../domain';
import { FederalStateMapper } from './federal-state.mapper';
import { SchoolYearMapper } from './school-year.mapper';
import { SystemMapper } from './system.mapper';

export class SchoolMapper {
	public static mapToDo(entity: SchoolEntity): School {
		const currentYear = entity.currentYear && SchoolYearMapper.mapToDo(entity.currentYear);
		const federalState = FederalStateMapper.mapToDo(entity.federalState);
		const features = this.mapFeatures(entity);
		const systems = entity.systems.getItems().map((system) => SystemMapper.mapToDo(system));

		const school = new School({
			id: entity.id,
			name: entity.name,
			officialSchoolNumber: entity.officialSchoolNumber,
			externalId: entity.externalId,
			previousExternalId: entity.previousExternalId,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			currentYear,
			federalState,
			county: entity.county,
			purpose: entity.purpose,
			features,
			systems,
			logo_dataUrl: entity.logo_dataUrl,
		});

		return school;
	}

	public static mapToDos(schoolEntities: SchoolEntity[]): School[] {
		const schools = schoolEntities.map((entity) => this.mapToDo(entity));

		return schools;
	}

	private static mapFeatures(entity: SchoolEntity): Set<SchoolFeature> {
		const features = new Set(entity.features);

		if (entity.enableStudentTeamCreation) {
			features.add(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		}

		return features;
	}
}
