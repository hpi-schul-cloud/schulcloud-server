import { Injectable } from '@nestjs/common';
import { ISchoolProperties, School } from '@shared/domain';
import { EntityName } from '@mikro-orm/core';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
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
		return SchoolMapper.mapDOToEntityProperties(entityDO);
	}

	protected mapEntityToDO(entity: School): SchoolDO {
		return SchoolMapper.mapEntityToDO(entity);
	}
}
