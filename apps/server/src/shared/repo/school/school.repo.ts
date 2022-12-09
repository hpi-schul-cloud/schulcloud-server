import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { ISchoolProperties, Role, School, System } from '@shared/domain';
import { EntityName, Reference } from '@mikro-orm/core';
import { BaseDORepo, EntityProperties } from '../base.do.repo';
import { SchoolDO } from '../../domain/domainobject/school.do';

@Injectable()
export class SchoolRepo extends BaseDORepo<SchoolDO, School, ISchoolProperties> {
	get entityName(): EntityName<School> {
		return School;
	}

	async findByExternalId(externalId: string, systemId: string): Promise<SchoolDO | null> {
		const school: School | null = await this._em.findOne(School, { externalId, systems: systemId });

		const schoolDo: SchoolDO | null = school ? this.mapEntityToDO(school) : null;
		return schoolDo;
	}

	async findBySchoolNumber(officialSchoolNumber: string): Promise<SchoolDO | null> {
		const school: School | null = await this._em.findOne(School, { officialSchoolNumber });

		const schoolDo: SchoolDO | null = school ? this.mapEntityToDO(school) : null;
		return schoolDo;
	}

	entityFactory(props: ISchoolProperties): School {
		return new School(props);
	}

	protected mapDOToEntityProperties(entityDO: SchoolDO): EntityProperties<ISchoolProperties> {
		return {
			externalId: entityDO.externalId,
			features: entityDO.features,
			inMaintenanceSince: entityDO.inMaintenanceSince,
			inUserMigration: entityDO.inUserMigration,
			name: entityDO.name,
			oauthMigrationMandatory: entityDO.oauthMigrationMandatory,
			oauthMigrationPossible: entityDO.oauthMigrationPossible,
			officialSchoolNumber: entityDO.officialSchoolNumber,
			schoolYear: entityDO.schoolYear,
			systems: entityDO.systems ? entityDO.systems.map((systemId) => Reference.createFromPK(System, systemId)) : [],
		};
	}

	protected mapEntityToDO(entity: School): SchoolDO {
		return new SchoolDO({
			externalId: entity.externalId,
			features: entity.features,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			name: entity.name,
			oauthMigrationMandatory: entity.oauthMigrationMandatory,
			oauthMigrationPossible: entity.oauthMigrationPossible,
			officialSchoolNumber: entity.officialSchoolNumber,
			schoolYear: entity.schoolYear,
			systems: entity.systems.isInitialized() ? entity.systems.getItems().map((system: System) => system.id) : [],
		});
	}
}
