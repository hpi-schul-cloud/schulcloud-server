import { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	EntityId,
	LegacySchoolDo,
	SchoolEntity,
	SchoolProperties,
	SystemEntity,
	UserLoginMigrationEntity,
} from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { BaseDORepo } from '../base.do.repo';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Injectable()
export class LegacySchoolRepo extends BaseDORepo<LegacySchoolDo, SchoolEntity, SchoolProperties> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	async findByExternalId(externalId: string, systemId: string): Promise<LegacySchoolDo | null> {
		const school: SchoolEntity | null = await this._em.findOne(SchoolEntity, { externalId, systems: systemId });

		const schoolDo: LegacySchoolDo | null = school ? this.mapEntityToDO(school) : null;
		return schoolDo;
	}

	async findBySchoolNumber(officialSchoolNumber: string): Promise<LegacySchoolDo | null> {
		const [schools, count] = await this._em.findAndCount(SchoolEntity, { officialSchoolNumber });
		if (count > 1) {
			throw new InternalServerErrorException(`Multiple schools found for officialSchoolNumber ${officialSchoolNumber}`);
		}

		const schoolDo: LegacySchoolDo | null = schools[0] ? this.mapEntityToDO(schools[0]) : null;
		return schoolDo;
	}

	entityFactory(props: SchoolProperties): SchoolEntity {
		return new SchoolEntity(props);
	}

	mapEntityToDO(entity: SchoolEntity): LegacySchoolDo {
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
			systems: entity.systems.isInitialized() ? entity.systems.getItems().map((system: SystemEntity) => system.id) : [],
			userLoginMigrationId: entity.userLoginMigration?.id,
			federalState: entity.federalState,
		});
	}

	mapDOToEntityProperties(entityDO: LegacySchoolDo): SchoolProperties {
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
				? entityDO.systems.map((systemId: EntityId) => this._em.getReference(SystemEntity, systemId))
				: [],
			userLoginMigration: entityDO.userLoginMigrationId
				? this._em.getReference(UserLoginMigrationEntity, entityDO.userLoginMigrationId)
				: undefined,
			federalState: entityDO.federalState,
		};
	}
}
