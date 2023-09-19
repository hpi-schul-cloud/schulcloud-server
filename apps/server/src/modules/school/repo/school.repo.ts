import { EntityName } from '@mikro-orm/core';
import { SchoolEntity } from '@shared/domain';
import { BaseRepo } from '@shared/repo';
import { SchoolRepo } from '../domain';
import { School } from '../domain/school';
import { SchoolMapper } from './mapper/school.mapper';

export class MikroOrmSchoolRepo extends BaseRepo<SchoolEntity> implements SchoolRepo {
	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	public async getAllSchools(): Promise<School[]> {
		const entities = await this._em.find(SchoolEntity, {});

		const schools = entities.map((entity) => SchoolMapper.mapToDo(entity));

		return schools;
	}
}
