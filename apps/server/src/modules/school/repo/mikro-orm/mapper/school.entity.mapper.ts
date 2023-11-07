import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { MikroOrmRepoUtils } from '@shared/repo/mikro-orm-repo.utils';
import { School, SchoolFeature } from '../../../domain';
import { FederalStateEntityMapper } from './federal-state.entity.mapper';
import { SchoolYearEntityMapper } from './school-year.entity.mapper';
import { SystemEntityMapper } from './system.entity.mapper';

export class SchoolEntityMapper {
	public static mapToDo(entity: SchoolEntity): School {
		MikroOrmRepoUtils.checkIfRequiredRefsArePopulated(entity, ['federalState']);
		MikroOrmRepoUtils.removeOptionalRefsIfNotPopulated(entity, ['currentYear', 'systems']);

		const currentYear = entity.currentYear && SchoolYearEntityMapper.mapToDo(entity.currentYear);
		const federalState = FederalStateEntityMapper.mapToDo(entity.federalState);
		const features = this.mapFeatures(entity);
		const systems = entity.systems?.getItems().map((system) => SystemEntityMapper.mapToDo(system));

		const school = new School({
			id: entity.id,
			name: entity.name,
			officialSchoolNumber: entity.officialSchoolNumber,
			externalId: entity.externalId,
			previousExternalId: entity.previousExternalId,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			purpose: entity.purpose,
			county: entity.county,
			logo_dataUrl: entity.logo_dataUrl,
			fileStorageType: entity.fileStorageType,
			language: entity.language,
			timezone: entity.timezone,
			permissions: entity.permissions,
			currentYear,
			federalState,
			features,
			systems,
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
