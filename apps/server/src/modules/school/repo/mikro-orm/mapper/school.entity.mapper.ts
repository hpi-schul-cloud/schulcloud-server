import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { FederalStateEntity, SchoolYearEntity, SystemEntity } from '@shared/domain/entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SchoolFactory } from '@src/modules/school/domain/factory';
import { School } from '../../../domain';
import { CountyEmbeddableMapper } from './county.embeddable.mapper';
import { FederalStateEntityMapper } from './federal-state.entity.mapper';
import { SchoolYearEntityMapper } from './school-year.entity.mapper';

export class SchoolEntityMapper {
	public static mapToDo(entity: SchoolEntity): School {
		const currentYear = entity.currentYear && SchoolYearEntityMapper.mapToDo(entity.currentYear);
		const federalState = FederalStateEntityMapper.mapToDo(entity.federalState);
		const features = new Set(entity.features);
		const county = entity.county && CountyEmbeddableMapper.mapToDo(entity.county);
		const systemIds = entity.systems.getItems().map((system) => system.id);
		const logo = entity.logo_dataUrl ? { dataUrl: entity.logo_dataUrl, name: entity.logo_name } : undefined;

		const school = SchoolFactory.build({
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
			logo,
			fileStorageType: entity.fileStorageType,
			language: entity.language,
			timezone: entity.timezone,
			permissions: entity.permissions,
			enableStudentTeamCreation: entity.enableStudentTeamCreation,
			systemIds,
			currentYear,
			federalState,
			features,
			county,
		});

		return school;
	}

	public static mapToDos(schoolEntities: SchoolEntity[]): School[] {
		const schools = schoolEntities.map((entity) => SchoolEntityMapper.mapToDo(entity));

		return schools;
	}

	public static mapToEntityProperties(domainObject: School, em: EntityManager): EntityData<SchoolEntity> {
		const props = domainObject.getProps();
		const federalState = props.federalState ? em.getReference(FederalStateEntity, props.federalState?.id) : undefined;
		const features = Array.from(props.features);
		const currentYear = props.currentYear ? em.getReference(SchoolYearEntity, props.currentYear?.id) : undefined;
		const county = props.county ? CountyEmbeddableMapper.mapToEntity(props.county) : undefined;
		const systems = props.systemIds ? props.systemIds.map((id) => em.getReference(SystemEntity, id)) : [];

		const schoolEntityProps = {
			name: props.name,
			officialSchoolNumber: props.officialSchoolNumber,
			externalId: props.externalId,
			previousExternalId: props.previousExternalId,
			inMaintenanceSince: props.inMaintenanceSince,
			inUserMigration: props.inUserMigration,
			purpose: props.purpose,
			logo_dataUrl: props.logo?.dataUrl,
			logo_name: props.logo?.name,
			fileStorageType: props.fileStorageType,
			language: props.language,
			timezone: props.timezone,
			permissions: props.permissions,
			enableStudentTeamCreation: props.enableStudentTeamCreation,
			federalState,
			features,
			currentYear,
			county,
			systems,
		};

		return schoolEntityProps;
	}
}
