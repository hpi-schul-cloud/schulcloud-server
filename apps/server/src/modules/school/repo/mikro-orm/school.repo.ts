import { FindOptions } from '@mikro-orm/core';
import { AutoPath, EntityData, EntityName } from '@mikro-orm/core/typings';
import { Injectable } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { School, SchoolProps, SchoolQuery, SchoolRepo } from '../../domain';
import { SchoolEntityMapper } from './mapper/school.entity.mapper';
import { SchoolScope } from './scope/school.scope';

@Injectable()
export class SchoolMikroOrmRepo extends BaseDomainObjectRepo<School, SchoolEntity> implements SchoolRepo {
	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	public async getSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(query.federalStateId);
		scope.byExternalId(query.externalId);
		scope.bySystemId(query.systemId);

		const findOptions = this.mapToMikroOrmOptions(options, ['federalState', 'currentYear']);

		const entities = await this.em.find(SchoolEntity, scope.query, findOptions);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	public async getSchoolById(schoolId: EntityId): Promise<School> {
		const entity = await this.em.findOneOrFail(
			SchoolEntity,
			{ id: schoolId },
			{ populate: ['federalState', 'currentYear'] }
		);

		const school = SchoolEntityMapper.mapToDo(entity);

		return school;
	}

	public async getSchoolsBySystemIds(systemIds: EntityId[]): Promise<School[]> {
		const entities = await this.em.find(
			SchoolEntity,
			{ systems: { $in: systemIds } },
			{ populate: ['federalState', 'currentYear'] }
		);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	protected mapDOToEntityProperties(domainObject: School): EntityData<SchoolEntity> {
		const entityProps = SchoolEntityMapper.mapToEntityProperties(domainObject, this.em);

		return entityProps;
	}

	private mapToMikroOrmOptions<P extends string = never>(
		options?: IFindOptions<SchoolProps>,
		populate?: AutoPath<SchoolEntity, P>[]
	): FindOptions<SchoolEntity, P> {
		const findOptions: FindOptions<SchoolEntity, P> = {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: options?.order,
			populate,
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
