import { EntityName, FindOptions } from '@mikro-orm/core';
import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface/find-options';
import { BaseRepo } from '@shared/repo/base.repo';
import { School, SchoolProps, SchoolQuery, SchoolRepo } from '../../domain';
import { SchoolEntityMapper } from './mapper/school.entity.mapper';
import { SchoolScope } from './scope/school.scope';

export class SchoolMikroOrmRepo extends BaseRepo<SchoolEntity> implements SchoolRepo {
	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	public async getAllSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(query.federalStateId);

		const findOptions = this.mapToMikroOrmOptions(options, ['federalState', 'currentYear', 'systems']);

		const entities = await this._em.find(SchoolEntity, scope.query, findOptions);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const entity = await this._em.findOneOrFail(
			SchoolEntity,
			{ id: schoolId },
			{ populate: ['federalState', 'currentYear', 'systems'] }
		);

		const school = SchoolEntityMapper.mapToDo(entity);

		return school;
	}

	// TODO: This should probably be a common mapper for all repos.
	private mapToMikroOrmOptions(options?: IFindOptions<SchoolProps>, populate?: string[]): FindOptions<SchoolEntity> {
		const findOptions: FindOptions<SchoolEntity> = {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: options?.order,
			populate: populate as never[],
		};

		// If no order is specified, a default order is applied here, because pagination can be messed up without order.
		if (!findOptions.orderBy) {
			findOptions.orderBy = {
				_id: SortOrder.asc,
			};
		}

		return findOptions;
	}
}
