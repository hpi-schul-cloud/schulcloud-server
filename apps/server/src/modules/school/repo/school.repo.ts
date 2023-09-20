import { EntityName, FindOptions } from '@mikro-orm/core';
import { EntityId, IFindOptions, SchoolEntity, SortOrder } from '@shared/domain';
import { BaseRepo } from '@shared/repo';
import { SchoolRepo } from '../domain';
import { School } from '../domain/school';
import { SchoolMapper } from './mapper/school.mapper';

export class MikroOrmSchoolRepo extends BaseRepo<SchoolEntity> implements SchoolRepo {
	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	public async getAllSchools(options?: IFindOptions<SchoolEntity>): Promise<School[]> {
		const findOptions = this.mapToMikroOrmOptions(options);

		const entities = await this._em.find(SchoolEntity, {}, findOptions);

		const schools = entities.map((entity) => SchoolMapper.mapToDo(entity));

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const entity = await this._em.findOneOrFail(SchoolEntity, { id: schoolId });

		const school = SchoolMapper.mapToDo(entity);

		return school;
	}

	// TODO: This should probably be a common mapper for all repos.
	private mapToMikroOrmOptions(options?: IFindOptions<SchoolEntity>): FindOptions<SchoolEntity> {
		const findOptions = {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: options?.order,
		};

		// If no order is specified, a default order is applied here, because without order pagination can be messed up.
		if (!findOptions.orderBy) {
			findOptions.orderBy = {
				_id: SortOrder.asc,
			};
		}

		return findOptions;
	}
}
