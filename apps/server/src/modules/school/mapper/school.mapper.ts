import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { ISchoolProperties, School, System } from '@shared/domain';
import { Reference } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolMapper {
	mapDOToEntityProperties(entityDO: SchoolDO): ISchoolProperties {
		return {
			externalId: entityDO.externalId,
			features: entityDO.features,
			inMaintenanceSince: entityDO.inMaintenanceSince,
			inUserMigration: entityDO.inUserMigration,
			name: entityDO.name,
			oauthMigrationMandatory: entityDO.oauthMigrationMandatory,
			oauthMigrationPossible: entityDO.oauthMigrationPossible,
			oauthMigrationFinished: entityDO.oauthMigrationFinished,
			previousExternalId: entityDO.previousExternalId,
			officialSchoolNumber: entityDO.officialSchoolNumber,
			schoolYear: entityDO.schoolYear,
			systems: entityDO.systems
				? entityDO.systems.map((systemId: string) => Reference.createFromPK(System, systemId))
				: [],
		};
	}

	mapEntityToDO(entity: School): SchoolDO {
		return new SchoolDO({
			id: entity.id,
			externalId: entity.externalId,
			features: entity.features,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			name: entity.name,
			oauthMigrationMandatory: entity.oauthMigrationMandatory,
			oauthMigrationPossible: entity.oauthMigrationPossible,
			oauthMigrationFinished: entity.oauthMigrationFinished,
			previousExternalId: entity.previousExternalId,
			officialSchoolNumber: entity.officialSchoolNumber,
			schoolYear: entity.schoolYear,
			systems: entity.systems.isInitialized() ? entity.systems.getItems().map((system: System) => system.id) : [],
		});
	}
}
