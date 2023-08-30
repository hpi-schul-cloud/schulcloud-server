import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, ISchoolProperties, LegacySchoolDo, School, System, UserLoginMigration } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class LegacySchoolRepo extends BaseDORepo<LegacySchoolDo, School, ISchoolProperties> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<School> {
		return School;
	}

	async findByExternalId(externalId: string, systemId: string): Promise<LegacySchoolDo | null> {
		const school: School | null = await this._em.findOne(School, { externalId, systems: systemId });

		const schoolDo: LegacySchoolDo | null = school ? this.mapEntityToDO(school) : null;
		return schoolDo;
	}

	async findBySchoolNumber(officialSchoolNumber: string): Promise<LegacySchoolDo | null> {
		const [schools, count] = await this._em.findAndCount(School, { officialSchoolNumber });
		if (count > 1) {
			throw new InternalServerErrorException(`Multiple schools found for officialSchoolNumber ${officialSchoolNumber}`);
		}

		const schoolDo: LegacySchoolDo | null = schools[0] ? this.mapEntityToDO(schools[0]) : null;
		return schoolDo;
	}

	entityFactory(props: ISchoolProperties): School {
		return new School(props);
	}

	mapEntityToDO(entity: School): LegacySchoolDo {
		return new LegacySchoolDo({
			id: entity.id,
			externalId: entity.externalId,
			features: entity.features,
			inMaintenanceSince: entity.inMaintenanceSince,
			inUserMigration: entity.inUserMigration,
			name: entity.name,
			previousExternalId: entity.previousExternalId,
			officialSchoolNumber: entity.officialSchoolNumber,
			schoolYear: entity.schoolYear,
			systems: entity.systems.isInitialized() ? entity.systems.getItems().map((system: System) => system.id) : [],
			userLoginMigrationId: entity.userLoginMigration?.id,
			federalState: entity.federalState,
		});
	}

	mapDOToEntityProperties(entityDO: LegacySchoolDo): ISchoolProperties {
		return {
			externalId: entityDO.externalId,
			features: entityDO.features,
			inMaintenanceSince: entityDO.inMaintenanceSince,
			inUserMigration: entityDO.inUserMigration,
			name: entityDO.name,
			previousExternalId: entityDO.previousExternalId,
			officialSchoolNumber: entityDO.officialSchoolNumber,
			schoolYear: entityDO.schoolYear,
			systems: entityDO.systems
				? entityDO.systems.map((systemId: EntityId) => this._em.getReference(System, systemId))
				: [],
			userLoginMigration: entityDO.userLoginMigrationId
				? this._em.getReference(UserLoginMigration, entityDO.userLoginMigrationId)
				: undefined,
			federalState: entityDO.federalState,
		};
	}
}
