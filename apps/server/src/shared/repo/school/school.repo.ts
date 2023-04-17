import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, ISchoolProperties, School, System } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { Logger } from '@src/core/logger';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class SchoolRepo extends BaseDORepo<SchoolDO, School, ISchoolProperties> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: Logger) {
		super(_em, logger);
	}

	get entityName(): EntityName<School> {
		return School;
	}

	async findByExternalId(externalId: string, systemId: string): Promise<SchoolDO | null> {
		const school: School | null = await this._em.findOne(School, { externalId, systems: systemId });

		const schoolDo: SchoolDO | null = school ? this.mapEntityToDO(school) : null;
		return schoolDo;
	}

	async findBySchoolNumber(officialSchoolNumber: string): Promise<SchoolDO | null> {
		const [schools, count] = await this._em.findAndCount(School, { officialSchoolNumber });
		if (count > 1) {
			throw new InternalServerErrorException(`Multiple schools found for officialSchoolNumber ${officialSchoolNumber}`);
		}

		const schoolDo: SchoolDO | null = schools[0] ? this.mapEntityToDO(schools[0]) : null;
		return schoolDo;
	}

	entityFactory(props: ISchoolProperties): School {
		return new School(props);
	}

	mapEntityToDO(entity: School): SchoolDO {
		return new SchoolDO({
			id: entity.id,
			externalId: entity.externalId,
			features: entity.features,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			name: entity.name,
			oauthMigrationStart: entity.oauthMigrationStart,
			oauthMigrationMandatory: entity.oauthMigrationMandatory,
			oauthMigrationPossible: entity.oauthMigrationPossible,
			oauthMigrationFinished: entity.oauthMigrationFinished,
			oauthMigrationFinalFinish: entity.oauthMigrationFinalFinish,
			previousExternalId: entity.previousExternalId,
			officialSchoolNumber: entity.officialSchoolNumber,
			schoolYear: entity.schoolYear,
			systems: entity.systems.isInitialized() ? entity.systems.getItems().map((system: System) => system.id) : [],
		});
	}

	mapDOToEntityProperties(entityDO: SchoolDO): ISchoolProperties {
		return {
			externalId: entityDO.externalId,
			features: entityDO.features,
			inMaintenanceSince: entityDO.inMaintenanceSince,
			inUserMigration: entityDO.inUserMigration,
			name: entityDO.name,
			oauthMigrationStart: entityDO.oauthMigrationStart,
			oauthMigrationMandatory: entityDO.oauthMigrationMandatory,
			oauthMigrationPossible: entityDO.oauthMigrationPossible,
			oauthMigrationFinished: entityDO.oauthMigrationFinished,
			oauthMigrationFinalFinish: entityDO.oauthMigrationFinalFinish,
			previousExternalId: entityDO.previousExternalId,
			officialSchoolNumber: entityDO.officialSchoolNumber,
			schoolYear: entityDO.schoolYear,
			systems: entityDO.systems
				? entityDO.systems.map((systemId: EntityId) => this._em.getReference(System, systemId))
				: [],
		};
	}
}
