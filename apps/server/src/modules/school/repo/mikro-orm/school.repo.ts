import { FindOptions } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { School, SchoolProps, SchoolQuery, SchoolRepo } from '../../domain';
import { SchoolEntityMapper } from './mapper/school.entity.mapper';
import { SchoolScope } from './scope/school.scope';

@Injectable()
export class SchoolMikroOrmRepo implements SchoolRepo {
	constructor(private readonly em: EntityManager) {}

	public async getAllSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(query.federalStateId);

		const findOptions = this.mapToMikroOrmOptions(options, ['federalState', 'currentYear']);

		const entities = await this.em.find(SchoolEntity, scope.query, findOptions);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const entity = await this.em.findOneOrFail(
			SchoolEntity,
			{ id: schoolId },
			{ populate: ['federalState', 'currentYear'] }
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
