import { Injectable } from '@nestjs/common';
import { ISchoolProperties, School } from '@shared/domain';
import { EntityName } from '@mikro-orm/core';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { EntityManager } from '@mikro-orm/mongodb';
import { BaseDORepo } from '../base.do.repo';
import { SchoolDO } from '../../domain/domainobject/school.do';
import { Logger } from '../../../core/logger';

@Injectable()
export class SchoolRepo extends BaseDORepo<SchoolDO, School, ISchoolProperties> {
	constructor(
		protected readonly _em: EntityManager,
		protected readonly logger: Logger,
		readonly schoolMapper: SchoolMapper
	) {
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
		const school: School | null = await this._em.findOne(School, { officialSchoolNumber });

		const schoolDo: SchoolDO | null = school ? this.mapEntityToDO(school) : null;
		return schoolDo;
	}

	entityFactory(props: ISchoolProperties): School {
		return new School(props);
	}

	protected mapDOToEntityProperties(entityDO: SchoolDO): ISchoolProperties {
		return this.schoolMapper.mapDOToEntityProperties(entityDO);
	}

	protected mapEntityToDO(entity: School): SchoolDO {
		return this.schoolMapper.mapEntityToDO(entity);
	}
}
