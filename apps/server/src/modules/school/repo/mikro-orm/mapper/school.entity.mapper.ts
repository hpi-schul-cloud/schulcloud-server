import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { School, SchoolFeature } from '../../../domain';
import { CountyEmbeddableMapper } from './county.embeddable.mapper';
import { FederalStateEntityMapper } from './federal-state.entity.mapper';
import { SchoolYearEntityMapper } from './school-year.entity.mapper';
import { SystemEntityMapper } from './system.entity.mapper';

export class SchoolEntityMapper {
	public static mapToDo(entity: SchoolEntity): School {
		const currentYear = entity.currentYear && SchoolYearEntityMapper.mapToDo(entity.currentYear);
		const federalState = FederalStateEntityMapper.mapToDo(entity.federalState);
		const features = SchoolEntityMapper.mapFeatures(entity);
		const systems = entity.systems?.getItems().map((system) => SystemEntityMapper.mapToDo(system));
		const county = entity.county && CountyEmbeddableMapper.mapToDo(entity.county);

		const school = new School({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			name: entity.name,
			officialSchoolNumber: entity.officialSchoolNumber,
			externalId: entity.externalId,
			previousExternalId: entity.previousExternalId,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			purpose: entity.purpose,
			logo_dataUrl: entity.logo_dataUrl,
			logo_name: entity.logo_name,
			fileStorageType: entity.fileStorageType,
			language: entity.language,
			timezone: entity.timezone,
			permissions: entity.permissions,
			currentYear,
			federalState,
			features,
			systems,
			county,
		});

		return school;
	}

	public static mapToDos(schoolEntities: SchoolEntity[]): School[] {
		const schools = schoolEntities.map((entity) => SchoolEntityMapper.mapToDo(entity));

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
